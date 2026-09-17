import { Query } from "@zudojs/cqrs";

export const GET_CROSS_REFERENCES = "bible.getCrossReferences" as const;

export interface GetCrossReferencesOptions {
  readonly translation: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
  readonly limit: number;
}

/** Reads the passages related to one verse, strongest link first. */
export class GetCrossReferencesQuery extends Query<typeof GET_CROSS_REFERENCES> {
  public readonly translation: string;
  public readonly book: string;
  public readonly chapter: number;
  public readonly verse: number;
  public readonly limit: number;

  public constructor(options: GetCrossReferencesOptions) {
    super(GET_CROSS_REFERENCES);
    this.translation = options.translation;
    this.book = options.book;
    this.chapter = options.chapter;
    this.verse = options.verse;
    this.limit = options.limit;
  }
}
