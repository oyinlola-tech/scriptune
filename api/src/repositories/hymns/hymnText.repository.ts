import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import { toAnyPairQuery } from "../../utils/text/text.helper.js";
import type { HymnSearchHit } from "../../models/index.js";

export interface HymnSearchInput {
  /** Raw query text for full-text matching. */
  readonly text: string;
  /** The same query normalized for trigram matching. */
  readonly normalizedText: string;
  readonly limit: number;
  readonly language?: string;
}

export interface HymnTextRepository {
  search(input: HymnSearchInput): Promise<readonly HymnSearchHit[]>;
}

/**
 * Ranks hymn texts by full-text rank, trigram similarity of the whole lyric
 * and how much of the first line the query contains. Someone who remembers
 * the opening words should land on the right hymn even if they misheard
 * the rest.
 */
export class PrismaHymnTextRepository implements HymnTextRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async search(input: HymnSearchInput): Promise<readonly HymnSearchHit[]> {
    const found: HymnSearchHit[] = [];
    const take = async (matcher: Prisma.Sql) => {
      const rows = await this.rank(matcher, input, input.limit - found.length, found.map((hit) => hit.textId));
      found.push(...rows);
    };
    // Same staging as verses: exact words, then any word, then trigram only for
    // a real phrase that still has no answer (the expensive path).
    await take(Prisma.sql`t.search_vector @@ websearch_to_tsquery('english', ${input.text})`);
    const anyPair = toAnyPairQuery(input.normalizedText);
    if (found.length === 0 && anyPair !== null) {
      await take(Prisma.sql`t.search_vector @@ to_tsquery('english', ${anyPair})`);
    }
    if (found.length === 0 && input.normalizedText.length >= MIN_FUZZY_CHARS) {
      await take(Prisma.sql`${input.normalizedText}::text <% t.normalized_lyrics`);
    }
    return found;
  }

  private rank(matcher: Prisma.Sql, input: HymnSearchInput, limit: number, exclude: readonly string[]): Promise<HymnSearchHit[]> {
    const language = input.language ?? null;
    const notSeen = exclude.length === 0 ? Prisma.sql`TRUE` : Prisma.sql`t.id NOT IN (${Prisma.join(exclude.map((id) => Prisma.sql`${id}::uuid`))})`;
    // A hymn with English and Yoruba words is one hymn: keep its best text.
    return this.prisma.$queryRaw<HymnSearchHit[]>(Prisma.sql`
      WITH query AS (
        SELECT websearch_to_tsquery('english', ${input.text}) AS ts, ${input.normalizedText}::text AS norm
      ),
      matches AS (
        SELECT DISTINCT ON (t.hymn_id)
               t.hymn_id AS "hymnId",
               t.id AS "textId",
               h.slug,
               t.title,
               t.language,
               t.first_line AS "firstLine",
               t.normalized_lyrics AS "normalizedLyrics",
               ts_rank_cd(t.search_vector, query.ts)::float8 AS rank,
               word_similarity(query.norm, t.normalized_lyrics)::float8 AS similarity,
               word_similarity(t.normalized_first_line, query.norm)::float8 AS "firstLineSimilarity",
               (ts_rank_cd(t.search_vector, query.ts) * 0.5
                + word_similarity(query.norm, t.normalized_lyrics) * 0.3
                + word_similarity(t.normalized_first_line, query.norm) * 0.2)::float8 AS score,
               h.canonical_title AS "canonicalTitle"
        FROM hymn_texts t
        JOIN hymns h ON h.id = t.hymn_id, query
        WHERE (${language}::text IS NULL OR t.language = ${language}::text)
          AND ${notSeen}
          AND (${matcher})
        ORDER BY t.hymn_id, score DESC
      )
      SELECT * FROM matches
      ORDER BY score DESC, "canonicalTitle" ASC
      LIMIT ${limit}
    `);
  }
}

const MIN_FUZZY_CHARS = 12;
