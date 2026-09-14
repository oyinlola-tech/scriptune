import { Query } from "@zudojs/cqrs";

export const SEARCH_VERSES = "bible.searchVerses" as const;

/** Ranks verses against free text: one translation, or every translation when `translation` is null. */
export class SearchVersesQuery extends Query<typeof SEARCH_VERSES> {
  public readonly translation: string | null;
  public readonly text: string;
  public readonly limit: number;

  public constructor(translation: string | null, text: string, limit: number = 10) {
    super(SEARCH_VERSES);
    this.translation = translation;
    this.text = text;
    this.limit = limit;
  }
}
