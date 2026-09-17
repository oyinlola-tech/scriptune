import { Query } from "@zudojs/cqrs";

export const GET_RELATED_HYMNS = "hymns.getRelatedHymns" as const;

/** Reads the hymns paired with one hymn, most alike first. */
export class GetRelatedHymnsQuery extends Query<typeof GET_RELATED_HYMNS> {
  public readonly slug: string;
  public readonly limit: number;

  public constructor(slug: string, limit: number) {
    super(GET_RELATED_HYMNS);
    this.slug = slug;
    this.limit = limit;
  }
}
