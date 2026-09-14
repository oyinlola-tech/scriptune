import { Query } from "@zudojs/cqrs";

export const LIST_COLLECTIONS = "library.listCollections" as const;

/** Lists the member's collections with item counts. */
export class ListCollectionsQuery extends Query<typeof LIST_COLLECTIONS> {
  public readonly userId: string;

  public constructor(userId: string) {
    super(LIST_COLLECTIONS);
    this.userId = userId;
  }
}
