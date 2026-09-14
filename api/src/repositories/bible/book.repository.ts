import type { TestamentName } from "../../constants/bible.books.js";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type { BookModel } from "../../models/index.js";

export interface BookUpsertInput {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  readonly deuterocanonical: boolean;
  readonly chapterCount: number;
}

/** A book's presence in one translation. */
export interface TranslationBookInput {
  readonly bookId: number;
  readonly chapterCount: number;
  readonly verseCount: number;
}

export interface BookRepository {
  /** Every known book with the most chapters any translation gives it. */
  findAll(): Promise<readonly BookModel[]>;
  findById(id: number): Promise<BookModel | null>;
  /** The books a translation contains, with that translation's chapter counts. */
  findForTranslation(translationId: string): Promise<readonly BookModel[]>;
  findInTranslation(translationId: string, bookId: number): Promise<BookModel | null>;
  upsertMany(books: readonly BookUpsertInput[]): Promise<void>;
  replaceTranslationBooks(translationId: string, books: readonly TranslationBookInput[]): Promise<void>;
}

export class PrismaBookRepository implements BookRepository {
  private readonly prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async findAll(): Promise<readonly BookModel[]> {
    return this.prisma.book.findMany({ orderBy: { id: "asc" } });
  }

  public async findById(id: number): Promise<BookModel | null> {
    return this.prisma.book.findUnique({ where: { id } });
  }

  public async findForTranslation(translationId: string): Promise<readonly BookModel[]> {
    const rows = await this.prisma.translationBook.findMany({ where: { translationId }, orderBy: { bookId: "asc" }, include: { book: true } });
    return rows.map((row) => ({ ...row.book, chapterCount: row.chapterCount }));
  }

  public async findInTranslation(translationId: string, bookId: number): Promise<BookModel | null> {
    const row = await this.prisma.translationBook.findUnique({ where: { translationId_bookId: { translationId, bookId } }, include: { book: true } });
    return row === null ? null : { ...row.book, chapterCount: row.chapterCount };
  }

  public async replaceTranslationBooks(translationId: string, books: readonly TranslationBookInput[]): Promise<void> {
    // One INSERT … ON CONFLICT so two imports of the same translation can run at once without tripping over each other.
    await this.prisma.$transaction(async (tx) => {
      await tx.translationBook.deleteMany({ where: { translationId, bookId: { notIn: books.map((book) => book.bookId) } } });
      if (books.length === 0) return;
      const rows = books.map((book) => Prisma.sql`(${translationId}::uuid, ${book.bookId}, ${book.chapterCount}, ${book.verseCount})`);
      await tx.$executeRaw`INSERT INTO bible_translation_books (translation_id, book_id, chapter_count, verse_count) VALUES ${Prisma.join(rows)}
        ON CONFLICT (translation_id, book_id) DO UPDATE SET chapter_count = EXCLUDED.chapter_count, verse_count = EXCLUDED.verse_count`;
    });
  }

  public async upsertMany(books: readonly BookUpsertInput[]): Promise<void> {
    await this.prisma.$transaction(
      books.map((book) =>
        this.prisma.book.upsert({
          where: { id: book.id },
          create: book,
          update: {
            slug: book.slug,
            name: book.name,
            abbreviation: book.abbreviation,
            testament: book.testament,
            deuterocanonical: book.deuterocanonical,
            chapterCount: book.chapterCount,
          },
        }),
      ),
    );
  }
}
