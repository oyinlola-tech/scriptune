import { Query } from "@zudojs/cqrs";

export const GET_HYMN = "hymns.getHymn" as const;

/** Reads a hymn page: texts, contributors, placements, topics, scripture. */
export class GetHymnQuery extends Query<typeof GET_HYMN> {
  public readonly slug: string;

  public constructor(slug: string) {
    super(GET_HYMN);
    this.slug = slug;
  }
}
