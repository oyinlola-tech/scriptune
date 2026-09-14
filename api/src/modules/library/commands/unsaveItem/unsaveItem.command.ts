import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const UNSAVE_ITEM = "library.unsaveItem" as const;

/** Removes a hymn or verse from the member's library. */
export class UnsaveItemCommand extends Command<typeof UNSAVE_ITEM> {
  public readonly userId: string;
  public readonly target: LibraryTarget;

  public constructor(userId: string, target: LibraryTarget) {
    super(UNSAVE_ITEM);
    this.userId = userId;
    this.target = target;
  }
}
