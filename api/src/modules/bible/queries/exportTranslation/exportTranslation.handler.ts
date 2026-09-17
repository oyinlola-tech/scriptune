import { QueryHandler } from "@zudojs/cqrs";
import { toTranslationSummary, type BibleExportDto, type BibleExportVerseRow } from "../../../../dtos/index.js";
import type { BookRepository, VerseRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { EXPORT_TRANSLATION, type ExportTranslationQuery } from "./exportTranslation.query.js";

export class ExportTranslationHandler extends QueryHandler<ExportTranslationQuery, BibleExportDto> {
  public readonly queryType = EXPORT_TRANSLATION;

  private readonly lookup: BibleLookup;
  private readonly books: BookRepository;
  private readonly verses: VerseRepository;

  public constructor(lookup: BibleLookup, books: BookRepository, verses: VerseRepository) {
    super();
    this.lookup = lookup;
    this.books = books;
    this.verses = verses;
  }

  public async execute(query: ExportTranslationQuery): Promise<BibleExportDto> {
    const translation = await this.lookup.requireTranslation(query.translation);
    const books = await this.books.findForTranslation(translation.id);
    const rows = await this.verses.findAllForTranslation(translation.id);
    const verses: BibleExportVerseRow[] = rows.map((row) => [row.bookId, row.chapter, row.verse, row.text]);
    return {
      translation: toTranslationSummary(translation),
      generatedAt: new Date().toISOString(),
      verseCount: verses.length,
      books: books.map((book) => ({ order: book.id, slug: book.slug, name: book.name, localName: book.localName ?? null, abbreviation: book.abbreviation, testament: book.testament, deuterocanonical: book.deuterocanonical, chapterCount: book.chapterCount })),
      verses,
    };
  }
}
