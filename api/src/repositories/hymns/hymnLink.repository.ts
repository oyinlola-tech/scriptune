import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type { ScriptureReferenceModel, TopicModel } from "../../models/index.js";

export interface TopicWithCount extends TopicModel {
  readonly hymnCount: number;
}

/** A hymn that references a passage, with the references that matched. */
export interface HymnForVerse {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
  readonly references: readonly ScriptureReferenceModel[];
}

/** A verse or a hymn as normalized words, for comparing the two. */
export interface ScriptureWordsRow { readonly bookId: number; readonly chapter: number; readonly verse: number; readonly normalizedText: string }
export interface HymnWordsRow { readonly hymnId: string; readonly normalizedLyrics: string }

export interface MatchedReferenceInput {
  readonly hymnId: string;
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  readonly note: string;
}

/** What the related-hymns comparison needs to know about one hymn text. */
export interface RelatableHymnRow { readonly hymnId: string; readonly language: string; readonly title: string; readonly normalizedLyrics: string; readonly chapters: readonly string[] }

export interface HymnRelationInput { readonly hymnId: string; readonly relatedHymnId: string; readonly score: number; readonly reason: string }

export interface RelatedHymnRow { readonly slug: string; readonly title: string; readonly firstLine: string | null; readonly reason: string }

/** Topics and scripture references: the links between hymns and everything else. */
export interface HymnLinkRepository {
  listTopics(): Promise<readonly TopicWithCount[]>;
  findHymnsForVerse(bookId: number, chapter: number, verse: number): Promise<readonly HymnForVerse[]>;
  /** The 66 shared books of one translation, as normalized text. */
  listScriptureWords(translationCode: string): Promise<readonly ScriptureWordsRow[]>;
  listHymnWords(language: string): Promise<readonly HymnWordsRow[]>;
  /** Replaces every matched link, leaving the ones hymnals state untouched. */
  replaceMatchedReferences(rows: readonly MatchedReferenceInput[]): Promise<number>;
  listRelatableHymns(): Promise<readonly RelatableHymnRow[]>;
  replaceRelations(rows: readonly HymnRelationInput[]): Promise<number>;
  findRelatedHymns(hymnId: string, limit: number): Promise<readonly RelatedHymnRow[]>;
}

export class PrismaHymnLinkRepository implements HymnLinkRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async listTopics(): Promise<readonly TopicWithCount[]> {
    const rows = await this.prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { hymns: true } } },
    });
    return rows.map(({ _count, ...topic }) => ({ ...topic, hymnCount: _count.hymns }));
  }

  public async findHymnsForVerse(bookId: number, chapter: number, verse: number): Promise<readonly HymnForVerse[]> {
    const rows = await this.prisma.hymnScriptureReference.findMany({
      where: {
        bookId,
        chapter,
        OR: [
          { verseStart: null },
          { verseStart: { lte: verse }, verseEnd: { gte: verse } },
          { verseStart: verse, verseEnd: null },
        ],
      },
      include: {
        hymn: {
          select: {
            slug: true,
            canonicalTitle: true,
            texts: { select: { firstLine: true }, orderBy: { language: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { hymn: { canonicalTitle: "asc" } },
    });
    const bySlug = new Map<string, { slug: string; title: string; firstLine: string | null; references: ScriptureReferenceModel[] }>();
    for (const row of rows) {
      const { hymn, ...reference } = row;
      const existing = bySlug.get(hymn.slug);
      if (existing === undefined) {
        bySlug.set(hymn.slug, { slug: hymn.slug, title: hymn.canonicalTitle, firstLine: hymn.texts[0]?.firstLine ?? null, references: [reference] });
      } else {
        existing.references.push(reference);
      }
    }
    return [...bySlug.values()];
  }

  public async listScriptureWords(translationCode: string): Promise<readonly ScriptureWordsRow[]> {
    return this.prisma.$queryRaw<ScriptureWordsRow[]>`
      SELECT v.book_id AS "bookId", v.chapter, v.verse, v.normalized_text AS "normalizedText"
        FROM bible_verses v JOIN bible_translations t ON t.id = v.translation_id
       WHERE t.code = ${translationCode} AND v.book_id <= 66
       ORDER BY v.book_id, v.chapter, v.verse`;
  }

  public async listHymnWords(language: string): Promise<readonly HymnWordsRow[]> {
    return this.prisma.$queryRaw<HymnWordsRow[]>`SELECT hymn_id AS "hymnId", normalized_lyrics AS "normalizedLyrics" FROM hymn_texts WHERE language = ${language}`;
  }

  public async replaceMatchedReferences(rows: readonly MatchedReferenceInput[]): Promise<number> {
    await this.prisma.$transaction(async (tx) => {
      await tx.hymnScriptureReference.deleteMany({ where: { origin: "matched" } });
      for (let start = 0; start < rows.length; start += 1000) {
        const values = rows.slice(start, start + 1000).map((row) => Prisma.sql`(gen_random_uuid(), ${row.hymnId}::uuid, ${row.bookId}, ${row.chapter}, ${row.verse}, ${row.verse}, ${row.note}, 'matched')`);
        await tx.$executeRaw`INSERT INTO hymn_scripture_references (id, hymn_id, book_id, chapter, verse_start, verse_end, note, origin) VALUES ${Prisma.join(values)}`;
      }
    }, { timeout: 120_000 });
    return this.prisma.hymnScriptureReference.count({ where: { origin: "matched" } });
  }

  public async listRelatableHymns(): Promise<readonly RelatableHymnRow[]> {
    return this.prisma.$queryRaw<RelatableHymnRow[]>`
      SELECT t.hymn_id AS "hymnId", t.language, t.title, t.normalized_lyrics AS "normalizedLyrics",
             COALESCE((SELECT array_agg(DISTINCT r.book_id || ':' || r.chapter) FROM hymn_scripture_references r WHERE r.hymn_id = t.hymn_id), ARRAY[]::text[]) AS chapters
        FROM hymn_texts t`;
  }

  public async replaceRelations(rows: readonly HymnRelationInput[]): Promise<number> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`TRUNCATE hymn_relations`;
      for (let start = 0; start < rows.length; start += 2000) {
        const values = rows.slice(start, start + 2000).map((row) => Prisma.sql`(${row.hymnId}::uuid, ${row.relatedHymnId}::uuid, ${row.score}, ${row.reason})`);
        await tx.$executeRaw`INSERT INTO hymn_relations (hymn_id, related_hymn_id, score, reason) VALUES ${Prisma.join(values)} ON CONFLICT DO NOTHING`;
      }
    }, { timeout: 120_000 });
    return this.prisma.hymnRelation.count();
  }

  /** A short range scan on the primary key; the comparing was done when the job ran. */
  public async findRelatedHymns(hymnId: string, limit: number): Promise<readonly RelatedHymnRow[]> {
    const rows = await this.prisma.hymnRelation.findMany({
      where: { hymnId },
      orderBy: { score: "desc" },
      take: limit,
      select: { reason: true, relatedHymn: { select: { slug: true, canonicalTitle: true, texts: { select: { firstLine: true }, orderBy: { language: "asc" }, take: 1 } } } },
    });
    return rows.map((row) => ({ slug: row.relatedHymn.slug, title: row.relatedHymn.canonicalTitle, firstLine: row.relatedHymn.texts[0]?.firstLine ?? null, reason: row.reason }));
  }
}
