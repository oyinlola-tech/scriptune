import { Query } from "@zudojs/cqrs";

export const GET_HYMNAL = "hymns.getHymnal" as const;

/** Reads a hymnal and one page of its table of contents. */
export class GetHymnalQuery extends Query<typeof GET_HYMNAL> {
  public readonly slug: string;
  public readonly page: number;
  public readonly limit: number;

  public constructor(slug: string, page: number = 1, limit: number = 25) {
    super(GET_HYMNAL);
    this.slug = slug;
    this.page = page;
    this.limit = limit;
  }
}
