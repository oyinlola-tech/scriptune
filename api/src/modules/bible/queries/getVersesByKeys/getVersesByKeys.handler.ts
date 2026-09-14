import { QueryHandler } from "@zudojs/cqrs";
import { formatReference, type VerseTargetDto } from "../../../../dtos/index.js";
import type { BookModel } from "../../../../models/index.js";
import type { BookRepository, TranslationRepository, VerseRepository } from "../../../../repositories/index.js";
import { findCanonicalBook } from "../../../../utils/text/bibleBook.helper.js";
import { GET_VERSES_BY_KEYS, type GetVersesByKeysQuery, type VerseKeyInput } from "./getVersesByKeys.query.js";

export class GetVersesByKeysHandler extends QueryHandler<GetVersesByKeysQuery, readonly VerseTargetDto[]> {
  public readonly queryType = GET_VERSES_BY_KEYS;

  private readonly translations: TranslationRepository;
  private readonly books: BookRepository;
  private readonly verses: VerseRepository;

  public constructor(translations: TranslationRepository, books: BookRepository, verses: VerseRepository) {
    super();
    this.translations = translations;
    this.books = books;
    this.verses = verses;
  }

  public async execute(query: GetVersesByKeysQuery): Promise<readonly VerseTargetDto[]> {
    if (query.keys.length === 0) {
      return [];
    }
    const byTranslation = new Map<string, VerseKeyInput[]>();
    for (const key of query.keys) {
      const code = key.translation.toUpperCase();
      byTranslation.set(code, [...(byTranslation.get(code) ?? []), key]);
    }
    const books = await this.books.findAll();
    const bookById = new Map<number, BookModel>(books.map((book) => [book.id, book]));
    const results: VerseTargetDto[] = [];
    for (const [code, keys] of byTranslation) {
      const translation = await this.translations.findByCode(code);
      if (translation === null) {
        continue;
      }
      const refs = keys.flatMap((key) => {
        const canonical = findCanonicalBook(key.book);
        return canonical === undefined ? [] : [{ bookId: canonical.order, chapter: key.chapter, verse: key.verse }];
      });
      const found = await this.verses.findByReferences(translation.id, refs);
      for (const verse of found) {
        const book = bookById.get(verse.bookId);
        if (book !== undefined) {
          results.push({ reference: formatReference(book, verse.chapter, verse.verse), translation: code, book: book.slug, chapter: verse.chapter, verse: verse.verse, text: verse.text });
        }
      }
    }
    return results;
  }
}
