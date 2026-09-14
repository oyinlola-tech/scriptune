import { Query } from "@zudojs/cqrs";

export const LIST_HISTORY = "library.listHistory" as const;

/** Lists the member's recent identifications, searches and views. */
export class ListHistoryQuery extends Query<typeof LIST_HISTORY> {
  public readonly userId: string;
  public readonly limit: number;

  public constructor(userId: string, limit: number = 50) {
    super(LIST_HISTORY);
    this.userId = userId;
    this.limit = limit;
  }
}
