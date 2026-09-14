import { Query } from "@zudojs/cqrs";

export const GET_HYMN_SUMMARIES = "hymns.getHymnSummaries" as const;

/** Resolves hymn slugs to title and first line, for libraries and lists. */
export class GetHymnSummariesQuery extends Query<typeof GET_HYMN_SUMMARIES> {
  public readonly slugs: readonly string[];

  public constructor(slugs: readonly string[]) {
    super(GET_HYMN_SUMMARIES);
    this.slugs = slugs;
  }
}
