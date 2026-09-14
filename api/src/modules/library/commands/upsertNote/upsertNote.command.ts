import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const UPSERT_NOTE = "library.upsertNote" as const;

/** Writes the member's personal note on a hymn or verse. */
export class UpsertNoteCommand extends Command<typeof UPSERT_NOTE> {
  public readonly userId: string;
  public readonly target: LibraryTarget;
  public readonly body: string;

  public constructor(userId: string, target: LibraryTarget, body: string) {
    super(UPSERT_NOTE);
    this.userId = userId;
    this.target = target;
    this.body = body;
  }
}
