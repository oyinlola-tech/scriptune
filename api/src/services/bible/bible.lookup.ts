import { NotFoundError } from "@zudojs/errors";
import type { BookModel, TranslationModel } from "../../models/index.js";
import type { BookRepository, TranslationRepository } from "../../repositories/index.js";
import { findCanonicalBook } from "../../utils/text/bibleBook.helper.js";

/** Resolves translations and books from user-supplied references. */
export class BibleLookup {
  private readonly translations: TranslationRepository;
  private readonly books: BookRepository;

  public constructor(translations: TranslationRepository, books: BookRepository) {
    this.translations = translations;
    this.books = books;
  }

  public async requireTranslation(code: string): Promise<TranslationModel> {
    const translation = await this.translations.findByCode(code.toUpperCase());
    if (translation === null) {
      throw new NotFoundError(`Translation "${code}" is not available.`);
    }
    return translation;
  }

  /** Resolves a book reference; with a translation, the book must be part of it and carries its chapter count. */
  public async requireBook(reference: string, translation?: TranslationModel): Promise<BookModel> {
    const canonical = findCanonicalBook(reference);
    if (canonical === undefined) {
      throw new NotFoundError(`Book "${reference}" was not found.`);
    }
    const book = translation === undefined ? await this.books.findById(canonical.order) : await this.books.findInTranslation(translation.id, canonical.order);
    if (book === null) {
      throw new NotFoundError(translation === undefined ? `Book "${reference}" was not found.` : `${canonical.name} is not part of the ${translation.code}.`);
    }
    return book;
  }

  public async requireChapter(book: BookModel, chapter: number): Promise<number> {
    if (chapter < 1 || chapter > book.chapterCount) {
      throw new NotFoundError(`${book.name} has ${book.chapterCount} chapters; chapter ${chapter} does not exist.`);
    }
    return chapter;
  }
}
