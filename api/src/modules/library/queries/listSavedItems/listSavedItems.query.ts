import { Query } from "@zudojs/cqrs";
import type { LibraryTargetTypeName } from "../../../../models/index.js";

export const LIST_SAVED_ITEMS = "library.listSavedItems" as const;

/** Lists what the member saved, newest first. */
export class ListSavedItemsQuery extends Query<typeof LIST_SAVED_ITEMS> {
  public readonly userId: string;
  public readonly targetType: LibraryTargetTypeName | undefined;

  public constructor(userId: string, targetType?: LibraryTargetTypeName) {
    super(LIST_SAVED_ITEMS);
    this.userId = userId;
    this.targetType = targetType;
  }
}
