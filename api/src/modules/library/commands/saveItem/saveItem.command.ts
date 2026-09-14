import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const SAVE_ITEM = "library.saveItem" as const;

/** Saves a hymn or verse to the member's library. Idempotent. */
export class SaveItemCommand extends Command<typeof SAVE_ITEM> {
  public readonly userId: string;
  public readonly target: LibraryTarget;

  public constructor(userId: string, target: LibraryTarget) {
    super(SAVE_ITEM);
    this.userId = userId;
    this.target = target;
  }
}
