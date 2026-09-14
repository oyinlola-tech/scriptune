import { QueryHandler } from "@zudojs/cqrs";
import { toBookDto, toTranslationSummary, toVerseDto, type ChapterDto } from "../../../../dtos/index.js";
import type { VerseRepository } from "../../../../repositories/index.js";
import type { BibleLookup } from "../../../../services/bible/index.js";
import { GET_CHAPTER, type GetChapterQuery } from "./getChapter.query.js";

export class GetChapterHandler extends QueryHandler<GetChapterQuery, ChapterDto> {
  public readonly queryType = GET_CHAPTER;

  private readonly lookup: BibleLookup;
  private readonly verses: VerseRepository;

  public constructor(lookup: BibleLookup, verses: VerseRepository) {
    super();
    this.lookup = lookup;
    this.verses = verses;
  }

  public async execute(query: GetChapterQuery): Promise<ChapterDto> {
    const translation = await this.lookup.requireTranslation(query.translation);
    const book = await this.lookup.requireBook(query.book, translation);
    const chapter = await this.lookup.requireChapter(book, query.chapter);
    const verses = await this.verses.findChapter(translation.id, book.id, chapter);
    return {
      translation: toTranslationSummary(translation),
      book: toBookDto(book),
      chapter,
      verses: verses.map((verse) => toVerseDto(book, verse)),
    };
  }
}
