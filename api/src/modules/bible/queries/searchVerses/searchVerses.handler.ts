import { QueryHandler } from "@zudojs/cqrs";
import { toTranslationSummary, toVerseSearchHitDto, type VerseSearchResultDto } from "../../../../dtos/index.js";
import type { BookModel, TranslationModel } from "../../../../models/index.js";
import type { BookRepository, TranslationRepository, VerseRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { normalizeText } from "../../../../utils/text/text.helper.js";
import { SEARCH_VERSES, type SearchVersesQuery } from "./searchVerses.query.js";

export class SearchVersesHandler extends QueryHandler<SearchVersesQuery, VerseSearchResultDto> {
  public readonly queryType = SEARCH_VERSES;

  private readonly lookup: BibleLookup;
  private readonly translations: TranslationRepository;
  private readonly books: BookRepository;
  private readonly verses: VerseRepository;

  public constructor(lookup: BibleLookup, translations: TranslationRepository, books: BookRepository, verses: VerseRepository) {
    super();
    this.lookup = lookup;
    this.translations = translations;
    this.books = books;
    this.verses = verses;
  }

  public async execute(query: SearchVersesQuery): Promise<VerseSearchResultDto> {
    const translation = query.translation === null ? null : await this.lookup.requireTranslation(query.translation);
    const summary = translation === null ? null : toTranslationSummary(translation);
    const normalizedText = normalizeText(query.text);
    if (normalizedText === "") {
      return { translation: summary, query: query.text, results: [] };
    }
    const [hits, books, translations] = await Promise.all([
      this.verses.search(translation?.id ?? null, { text: query.text, normalizedText, limit: query.limit }),
      this.books.findAll(),
      translation === null ? this.translations.findAll() : Promise.resolve<readonly TranslationModel[]>([translation]),
    ]);
    const byId = new Map<number, BookModel>(books.map((book) => [book.id, book]));
    const codeById = new Map<string, string>(translations.map((entry) => [entry.id, entry.code]));
    return {
      translation: summary,
      query: query.text,
      results: hits.flatMap((hit) => {
        const book = byId.get(hit.bookId);
        const code = codeById.get(hit.translationId);
        return book === undefined || code === undefined ? [] : [toVerseSearchHitDto(book, hit, code)];
      }),
    };
  }
}
