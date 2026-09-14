import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const DELETE_NOTE = "library.deleteNote" as const;

/** Removes the member's note on a hymn or verse. */
export class DeleteNoteCommand extends Command<typeof DELETE_NOTE> {
  public readonly userId: string;
  public readonly target: LibraryTarget;

  public constructor(userId: string, target: LibraryTarget) {
    super(DELETE_NOTE);
    this.userId = userId;
    this.target = target;
  }
}
