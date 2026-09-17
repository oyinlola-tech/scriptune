import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type { VerseModel, VerseSearchHit } from "../../models/index.js";
import { toAnyPairQuery } from "../../utils/text/text.helper.js";

export interface VerseWriteInput {
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
  readonly normalizedText: string;
}

export interface VerseSearchInput {
  /** Raw query text for full-text matching. */
  readonly text: string;
  /** The same query normalized for trigram matching. */
  readonly normalizedText: string;
  readonly limit: number;
}

export interface VerseReference {
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
}

/** A verse without ids, as streamed into a corpus export. */
export interface VerseExportRow {
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
}

export interface VerseRepository {
  /** Every verse of a translation in canonical order. */
  findAllForTranslation(translationId: string): Promise<readonly VerseExportRow[]>;
  findByReferences(translationId: string, references: readonly VerseReference[]): Promise<readonly VerseModel[]>;
  findChapter(translationId: string, bookId: number, chapter: number): Promise<readonly VerseModel[]>;
  findVerse(translationId: string, bookId: number, chapter: number, verse: number): Promise<VerseModel | null>;
  findRange(translationId: string, bookId: number, chapter: number, fromVerse: number, toVerse: number): Promise<readonly VerseModel[]>;
  replaceForTranslation(translationId: string, verses: readonly VerseWriteInput[]): Promise<number>;
  /** Ranks verses against free text; `translationId` null searches every translation, one hit per verse. */
  search(translationId: string | null, input: VerseSearchInput): Promise<readonly VerseSearchHit[]>;
}

const VERSE_SELECT = { id: true, translationId: true, bookId: true, chapter: true, verse: true, text: true } as const;
const IMPORT_BATCH_SIZE = 2_000;
const IMPORT_TRANSACTION_TIMEOUT_MS = 180_000;

export class PrismaVerseRepository implements VerseRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findByReferences(translationId: string, references: readonly VerseReference[]): Promise<readonly VerseModel[]> {
    if (references.length === 0) {
      return [];
    }
    return this.prisma.verse.findMany({
      where: { translationId, OR: references.map((reference) => ({ ...reference })) },
      orderBy: [{ bookId: "asc" }, { chapter: "asc" }, { verse: "asc" }],
      select: VERSE_SELECT,
    });
  }

  public async findAllForTranslation(translationId: string): Promise<readonly VerseExportRow[]> {
    const orderBy = [{ bookId: "asc" }, { chapter: "asc" }, { verse: "asc" }] as const;
    return this.prisma.verse.findMany({ where: { translationId }, orderBy: [...orderBy], select: { bookId: true, chapter: true, verse: true, text: true } });
  }

  public async findChapter(translationId: string, bookId: number, chapter: number): Promise<readonly VerseModel[]> {
    return this.prisma.verse.findMany({
      where: { translationId, bookId, chapter },
      orderBy: { verse: "asc" },
      select: VERSE_SELECT,
    });
  }

  public async findVerse(translationId: string, bookId: number, chapter: number, verse: number): Promise<VerseModel | null> {
    return this.prisma.verse.findUnique({
      where: { translationId_bookId_chapter_verse: { translationId, bookId, chapter, verse } },
      select: VERSE_SELECT,
    });
  }

  public async findRange(translationId: string, bookId: number, chapter: number, fromVerse: number, toVerse: number): Promise<readonly VerseModel[]> {
    if (toVerse < fromVerse) {
      return [];
    }
    return this.prisma.verse.findMany({
      where: { translationId, bookId, chapter, verse: { gte: fromVerse, lte: toVerse } },
      orderBy: { verse: "asc" },
      select: VERSE_SELECT,
    });
  }

  public async replaceForTranslation(translationId: string, verses: readonly VerseWriteInput[]): Promise<number> {
    const inserted = await this.replaceInTransaction(translationId, verses);
    await this.prisma.$executeRawUnsafe("VACUUM ANALYZE bible_verses");
    return inserted;
  }

  /**
   * Deletes and re-inserts inside one transaction, then vacuums: that
   * refreshes planner statistics and merges the GIN pending lists, so the
   * first searches after a bulk load are as fast as the thousandth.
   */
  private async replaceInTransaction(translationId: string, verses: readonly VerseWriteInput[]): Promise<number> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.verse.deleteMany({ where: { translationId } });
        let inserted = 0;
        for (let offset = 0; offset < verses.length; offset += IMPORT_BATCH_SIZE) {
          const batch = verses.slice(offset, offset + IMPORT_BATCH_SIZE);
          // Two imports of the same translation may overlap (the test suite does this); the later one keeps the earlier rows.
          const result = await tx.verse.createMany({
            data: batch.map((verse) => ({ translationId, ...verse })),
            skipDuplicates: true,
          });
          inserted += result.count;
        }
        return inserted;
      },
      { timeout: IMPORT_TRANSACTION_TIMEOUT_MS, maxWait: 10_000 },
    );
  }

  public async search(translationId: string | null, input: VerseSearchInput): Promise<readonly VerseSearchHit[]> {
    const scope = translationId === null ? Prisma.sql`TRUE` : Prisma.sql`v.translation_id = ${translationId}::uuid`;
    const found: VerseSearchHit[] = [];
    const take = async (matcher: Prisma.Sql) => {
      const rows = await this.rank(scope, matcher, translationId === null, input, input.limit - found.length, found.map((hit) => hit.id));
      found.push(...rows);
    };
    // 1. Every word present: one GIN lookup, a few milliseconds.
    await take(Prisma.sql`v.search_vector @@ websearch_to_tsquery('english', scriptune_fold(${input.text}))`);
    // 2. Nothing exact: any two of the stronger words together, still an index
    //    lookup, forgives a misheard word without matching every verse that says "my".
    const anyPair = toAnyPairQuery(input.normalizedText);
    if (found.length === 0 && anyPair !== null) {
      await take(Prisma.sql`v.search_vector @@ to_tsquery('english', ${anyPair})`);
    }
    // 3. Still nothing: trigram similarity catches spelling, but rechecks thousands
    //    of rows (hundreds of milliseconds), so only for a real phrase.
    if (found.length === 0 && input.normalizedText.length >= MIN_FUZZY_CHARS) {
      await take(Prisma.sql`${input.normalizedText}::text <% v.normalized_text`);
    }
    return found;
  }

  private rank(scope: Prisma.Sql, matcher: Prisma.Sql, onePerVerse: boolean, input: VerseSearchInput, limit: number, exclude: readonly number[]): Promise<VerseSearchHit[]> {
    const notSeen = exclude.length === 0 ? Prisma.sql`TRUE` : Prisma.sql`v.id NOT IN (${Prisma.join(exclude)})`;
    // Across translations the same verse would appear once per Bible; keep the
    // best-scoring text and, on a tie, the default translation.
    const distinct = onePerVerse ? Prisma.sql`DISTINCT ON (v.book_id, v.chapter, v.verse)` : Prisma.empty;
    const tieBreak = onePerVerse ? Prisma.sql`ORDER BY v.book_id, v.chapter, v.verse, score DESC, t.is_default DESC` : Prisma.empty;
    return this.prisma.$queryRaw<VerseSearchHit[]>(Prisma.sql`
      WITH query AS (
        SELECT websearch_to_tsquery('english', scriptune_fold(${input.text})) AS ts, ${input.normalizedText}::text AS norm
      ),
      matches AS (
        SELECT ${distinct}
               v.id,
               v.translation_id AS "translationId",
               v.book_id AS "bookId",
               v.chapter,
               v.verse,
               v.text,
               ts_rank_cd(v.search_vector, query.ts)::float8 AS rank,
               word_similarity(query.norm, v.normalized_text)::float8 AS similarity,
               (ts_rank_cd(v.search_vector, query.ts) * 0.6 + word_similarity(query.norm, v.normalized_text) * 0.4)::float8 AS score
        FROM bible_verses v
        JOIN bible_translations t ON t.id = v.translation_id, query
        WHERE ${scope} AND ${notSeen} AND (${matcher})
        ${tieBreak}
      )
      SELECT * FROM matches
      ORDER BY score DESC, "bookId" ASC, chapter ASC, verse ASC
      LIMIT ${limit}
    `);
  }
}

/** Normalized text below this length is too short for trigram matching to mean anything. */
const MIN_FUZZY_CHARS = 12;
