import { Query } from "@zudojs/cqrs";

export const GET_CHAPTER = "bible.getChapter" as const;

/** Reads every verse of one chapter. */
export class GetChapterQuery extends Query<typeof GET_CHAPTER> {
  public readonly translation: string;
  public readonly book: string;
  public readonly chapter: number;

  public constructor(translation: string, book: string, chapter: number) {
    super(GET_CHAPTER);
    this.translation = translation;
    this.book = book;
    this.chapter = chapter;
  }
}
