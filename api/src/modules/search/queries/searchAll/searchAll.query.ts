import { Query } from "@zudojs/cqrs";

export const SEARCH_ALL = "search.all" as const;
export type SearchScope = "all" | "verses" | "hymns";

export interface SearchAllOptions {
  readonly text: string;
  readonly scope?: SearchScope;
  readonly limit?: number;
  readonly translation?: string;
  readonly language?: string;
}

/** Searches verses and hymns with one piece of text. */
export class SearchAllQuery extends Query<typeof SEARCH_ALL> {
  public readonly text: string;
  public readonly scope: SearchScope;
  public readonly limit: number;
  public readonly translation: string | undefined;
  public readonly language: string | undefined;

  public constructor(options: SearchAllOptions) {
    super(SEARCH_ALL);
    this.text = options.text;
    this.scope = options.scope ?? "all";
    this.limit = options.limit ?? 5;
    this.translation = options.translation;
    this.language = options.language;
  }
}
