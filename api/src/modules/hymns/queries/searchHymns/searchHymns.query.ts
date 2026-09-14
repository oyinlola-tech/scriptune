import { Query } from "@zudojs/cqrs";

export const SEARCH_HYMNS = "hymns.searchHymns" as const;

/** Ranks hymns against free text such as remembered lyrics. */
export class SearchHymnsQuery extends Query<typeof SEARCH_HYMNS> {
  public readonly text: string;
  public readonly limit: number;
  public readonly language: string | undefined;

  public constructor(text: string, limit: number = 10, language?: string) {
    super(SEARCH_HYMNS);
    this.text = text;
    this.limit = limit;
    this.language = language;
  }
}
