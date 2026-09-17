import { CommandHandler } from "@zudojs/cqrs";
import { ValidationError } from "@zudojs/errors";
import { CANONICAL_BOOKS } from "../../../../constants/bible.books.js";
import type {
  BookRepository,
  BookUpsertInput,
  TranslationRepository,
  VerseRepository,
  VerseWriteInput,
} from "../../../../repositories/index.js";
import { canonicalBookAt } from "../../../../utils/text/bibleBook.helper.js";
import { normalizeText } from "../../../../utils/text/text.helper.js";
import {
  IMPORT_TRANSLATION,
  type ImportBookInput,
  type ImportTranslationCommand,
  type ImportTranslationResult,
} from "./importTranslation.command.js";

function toBookUpsert(book: ImportBookInput, knownChapterCount: number): BookUpsertInput {
  const canonical = canonicalBookAt(book.order);
  if (canonical === undefined) {
    throw new ValidationError(`Book order ${book.order} is outside the canon (1 to ${CANONICAL_BOOKS.length}).`);
  }
  return {
    id: canonical.order,
    slug: canonical.slug,
    name: canonical.name,
    abbreviation: canonical.abbreviation,
    testament: canonical.testament,
    deuterocanonical: canonical.deuterocanonical,
    chapterCount: Math.max(knownChapterCount, book.chapters.length),
  };
}

function countVerses(book: ImportBookInput): number {
  return book.chapters.reduce((total, chapter) => total + chapter.filter((text) => text.trim() !== "").length, 0);
}

function toVerseRows(books: readonly ImportBookInput[]): VerseWriteInput[] {
  const rows: VerseWriteInput[] = [];
  for (const book of books) {
    book.chapters.forEach((verses, chapterIndex) => {
      verses.forEach((text, verseIndex) => {
        const trimmed = text.trim();
        if (trimmed !== "") {
          rows.push({
            bookId: book.order,
            chapter: chapterIndex + 1,
            verse: verseIndex + 1,
            text: trimmed,
            normalizedText: normalizeText(trimmed),
          });
        }
      });
    });
  }
  return rows;
}

/** Upserts the translation and its books, then replaces the verse text in one transaction. */
export class ImportTranslationHandler extends CommandHandler<ImportTranslationCommand, ImportTranslationResult> {
  public readonly commandType = IMPORT_TRANSLATION;

  private readonly translations: TranslationRepository;
  private readonly books: BookRepository;
  private readonly verses: VerseRepository;

  public constructor(translations: TranslationRepository, books: BookRepository, verses: VerseRepository) {
    super();
    this.translations = translations;
    this.books = books;
    this.verses = verses;
  }

  public async execute(command: ImportTranslationCommand): Promise<ImportTranslationResult> {
    const startedAt = performance.now();
    const { translation: translationInput, books } = command.input;
    const orders = new Set(books.map((book) => book.order));
    if (orders.size !== books.length) {
      throw new ValidationError("Each book may appear only once in an import.");
    }

    const translation = await this.translations.upsert(translationInput);
    const known = new Map((await this.books.findAll()).map((book) => [book.id, book.chapterCount]));
    await this.books.upsertMany(books.map((book) => toBookUpsert(book, known.get(book.order) ?? 0)));
    await this.books.replaceTranslationBooks(translation.id, books.map((book) => ({ bookId: book.order, chapterCount: book.chapters.length, verseCount: countVerses(book), localName: book.localName ?? null })));
    const verseCount = await this.verses.replaceForTranslation(translation.id, toVerseRows(books));
    await this.translations.setVerseCount(translation.id, verseCount);

    return {
      translationId: translation.id,
      code: translation.code,
      bookCount: books.length,
      verseCount,
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}
