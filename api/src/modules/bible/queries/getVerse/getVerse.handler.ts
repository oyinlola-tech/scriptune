import { QueryHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toTranslationSummary, toVerseDto, type VerseDetailDto } from "../../../../dtos/index.js";
import type { VerseRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { GET_VERSE, type GetVerseQuery } from "./getVerse.query.js";

export class GetVerseHandler extends QueryHandler<GetVerseQuery, VerseDetailDto> {
  public readonly queryType = GET_VERSE;

  private readonly lookup: BibleLookup;
  private readonly verses: VerseRepository;

  public constructor(lookup: BibleLookup, verses: VerseRepository) {
    super();
    this.lookup = lookup;
    this.verses = verses;
  }

  public async execute(query: GetVerseQuery): Promise<VerseDetailDto> {
    const translation = await this.lookup.requireTranslation(query.translation);
    const book = await this.lookup.requireBook(query.book, translation);
    const chapter = await this.lookup.requireChapter(book, query.chapter);
    const verse = await this.verses.findVerse(translation.id, book.id, chapter, query.verse);
    if (verse === null) {
      throw new NotFoundError(`${book.name} ${chapter}:${query.verse} does not exist.`);
    }
    const [before, after] =
      query.context > 0
        ? await Promise.all([
            this.verses.findRange(translation.id, book.id, chapter, query.verse - query.context, query.verse - 1),
            this.verses.findRange(translation.id, book.id, chapter, query.verse + 1, query.verse + query.context),
          ])
        : [[], []];
    return {
      translation: toTranslationSummary(translation),
      verse: toVerseDto(book, verse),
      context: {
        before: before.map((entry) => toVerseDto(book, entry)),
        after: after.map((entry) => toVerseDto(book, entry)),
      },
    };
  }
}
