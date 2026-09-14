import { Query } from "@zudojs/cqrs";

export const GET_COLLECTION = "library.getCollection" as const;

/** Reads a collection with its items resolved to content. */
export class GetCollectionQuery extends Query<typeof GET_COLLECTION> {
  public readonly userId: string;
  public readonly slug: string;

  public constructor(userId: string, slug: string) {
    super(GET_COLLECTION);
    this.userId = userId;
    this.slug = slug;
  }
}
