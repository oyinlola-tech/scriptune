import { Query } from "@zudojs/cqrs";

export const GET_VERSE = "bible.getVerse" as const;

export interface GetVerseOptions {
  readonly translation: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
  /** Number of surrounding verses to include on each side. */
  readonly context?: number;
}

/** Reads one verse with optional surrounding context. */
export class GetVerseQuery extends Query<typeof GET_VERSE> {
  public readonly translation: string;
  public readonly book: string;
  public readonly chapter: number;
  public readonly verse: number;
  public readonly context: number;

  public constructor(options: GetVerseOptions) {
    super(GET_VERSE);
    this.translation = options.translation;
    this.book = options.book;
    this.chapter = options.chapter;
    this.verse = options.verse;
    this.context = options.context ?? 0;
  }
}
