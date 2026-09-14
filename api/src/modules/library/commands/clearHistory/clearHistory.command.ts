import { Command } from "@zudojs/cqrs";

export const CLEAR_HISTORY = "library.clearHistory" as const;

/** Deletes the member's whole history. */
export class ClearHistoryCommand extends Command<typeof CLEAR_HISTORY> {
  public readonly userId: string;

  public constructor(userId: string) {
    super(CLEAR_HISTORY);
    this.userId = userId;
  }
}
