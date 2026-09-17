import { QueryHandler } from "@zudojs/cqrs";
import { CROSS_REFERENCE_SOURCE, PSALMS_BOOK_ID, VULGATE_PSALM_TRANSLATIONS } from "../../../../constants/index.js";
import { formatReference, toBookSummary, toTranslationSummary, type CrossReferencesDto } from "../../../../dtos/index.js";
import type { BookRepository, CrossReferenceRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { GET_CROSS_REFERENCES, type GetCrossReferencesQuery } from "./getCrossReferences.query.js";

export class GetCrossReferencesHandler extends QueryHandler<GetCrossReferencesQuery, CrossReferencesDto> {
  public readonly queryType = GET_CROSS_REFERENCES;

  private readonly lookup: BibleLookup;
  private readonly books: BookRepository;
  private readonly crossReferences: CrossReferenceRepository;

  public constructor(lookup: BibleLookup, books: BookRepository, crossReferences: CrossReferenceRepository) {
    super();
    this.lookup = lookup;
    this.books = books;
    this.crossReferences = crossReferences;
  }

  public async execute(query: GetCrossReferencesQuery): Promise<CrossReferencesDto> {
    const translation = await this.lookup.requireTranslation(query.translation);
    const book = await this.lookup.requireBook(query.book, translation);
    const chapter = await this.lookup.requireChapter(book, query.chapter);
    const vulgatePsalms = VULGATE_PSALM_TRANSLATIONS.has(translation.code);
    const base = { translation: toTranslationSummary(translation), reference: formatReference(book, chapter, query.verse), source: CROSS_REFERENCE_SOURCE };
    // The deuterocanonical books are not in the dataset, and a Vulgate-numbered psalm is not the psalm the links mean.
    if (book.deuterocanonical || (vulgatePsalms && book.id === PSALMS_BOOK_ID)) return { ...base, references: [] };

    const hits = await this.crossReferences.findForVerse({
      translationId: translation.id, bookId: book.id, chapter, verse: query.verse, limit: query.limit,
      excludeBookIds: vulgatePsalms ? [PSALMS_BOOK_ID] : [],
    });
    if (hits.length === 0) return { ...base, references: [] };
    const bookById = new Map((await this.books.findForTranslation(translation.id)).map((entry) => [entry.id, entry]));
    return {
      ...base,
      references: hits.flatMap((hit) => {
        const target = bookById.get(hit.toBookId);
        if (target === undefined) return [];
        const endVerse = hit.toVerseEnd > hit.toVerseStart ? hit.toVerseEnd : null;
        const reference = formatReference(target, hit.toChapter, hit.toVerseStart) + (endVerse === null ? "" : `-${endVerse}`);
        return [{ reference, book: toBookSummary(target), chapter: hit.toChapter, verse: hit.toVerseStart, endVerse, text: hit.text }];
      }),
    };
  }
}
