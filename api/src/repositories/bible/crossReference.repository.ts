import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";

export interface CrossReferenceInput {
  readonly fromBookId: number;
  readonly fromChapter: number;
  readonly fromVerse: number;
  readonly toBookId: number;
  readonly toChapter: number;
  readonly toVerseStart: number;
  readonly toVerseEnd: number;
  readonly votes: number;
}

/** A linked passage with the text of its first verse in the translation being read. */
export interface CrossReferenceHit {
  readonly toBookId: number;
  readonly toChapter: number;
  readonly toVerseStart: number;
  readonly toVerseEnd: number;
  readonly votes: number;
  readonly text: string;
}

export interface CrossReferenceLookup {
  readonly translationId: string;
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  readonly limit: number;
  /** Books to leave out, for translations that number them differently. */
  readonly excludeBookIds: readonly number[];
}

export interface CrossReferenceRepository {
  findForVerse(lookup: CrossReferenceLookup): Promise<readonly CrossReferenceHit[]>;
  replaceAll(rows: readonly CrossReferenceInput[]): Promise<number>;
  count(): Promise<number>;
}

const INSERT_BATCH = 5000;

export class PrismaCrossReferenceRepository implements CrossReferenceRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** One range scan on the primary key, joined to the verse text by its unique key. */
  public async findForVerse(lookup: CrossReferenceLookup): Promise<readonly CrossReferenceHit[]> {
    const excluded = lookup.excludeBookIds.length === 0 ? Prisma.empty : Prisma.sql`AND x.to_book_id NOT IN (${Prisma.join(lookup.excludeBookIds)})`;
    return this.prisma.$queryRaw<CrossReferenceHit[]>`
      SELECT x.to_book_id AS "toBookId", x.to_chapter AS "toChapter", x.to_verse_start AS "toVerseStart",
             x.to_verse_end AS "toVerseEnd", x.votes, v.text
        FROM bible_cross_references x
        JOIN bible_verses v
          ON v.translation_id = ${lookup.translationId}::uuid AND v.book_id = x.to_book_id
         AND v.chapter = x.to_chapter AND v.verse = x.to_verse_start
       WHERE x.from_book_id = ${lookup.bookId} AND x.from_chapter = ${lookup.chapter} AND x.from_verse = ${lookup.verse}
             ${excluded}
       ORDER BY x.votes DESC, x.to_book_id, x.to_chapter, x.to_verse_start
       LIMIT ${lookup.limit}`;
  }

  public async replaceAll(rows: readonly CrossReferenceInput[]): Promise<number> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`TRUNCATE bible_cross_references`;
        for (let start = 0; start < rows.length; start += INSERT_BATCH) {
          const values = rows.slice(start, start + INSERT_BATCH).map((row) => Prisma.sql`(${row.fromBookId}, ${row.fromChapter}, ${row.fromVerse}, ${row.toBookId}, ${row.toChapter}, ${row.toVerseStart}, ${row.toVerseEnd}, ${row.votes})`);
          await tx.$executeRaw`INSERT INTO bible_cross_references (from_book_id, from_chapter, from_verse, to_book_id, to_chapter, to_verse_start, to_verse_end, votes)
            VALUES ${Prisma.join(values)} ON CONFLICT DO NOTHING`;
        }
      },
      { timeout: 300_000, maxWait: 10_000 },
    );
    return this.count();
  }

  public async count(): Promise<number> {
    return this.prisma.crossReference.count();
  }
}
