import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const REMOVE_COLLECTION_ITEM = "library.removeCollectionItem" as const;

/** Removes a hymn or verse from a collection. */
export class RemoveCollectionItemCommand extends Command<typeof REMOVE_COLLECTION_ITEM> {
  public readonly userId: string;
  public readonly slug: string;
  public readonly target: LibraryTarget;

  public constructor(userId: string, slug: string, target: LibraryTarget) {
    super(REMOVE_COLLECTION_ITEM);
    this.userId = userId;
    this.slug = slug;
    this.target = target;
  }
}
