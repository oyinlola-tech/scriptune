import { Command } from "@zudojs/cqrs";
import type { HistoryEntryInput } from "../../../../repositories/index.js";

export const ADD_HISTORY = "library.addHistory" as const;

/** Records one or many history entries, e.g. a guest history being imported after sign-up. */
export class AddHistoryCommand extends Command<typeof ADD_HISTORY> {
  public readonly userId: string;
  public readonly entries: readonly HistoryEntryInput[];

  public constructor(userId: string, entries: readonly HistoryEntryInput[]) {
    super(ADD_HISTORY);
    this.userId = userId;
    this.entries = entries;
  }
}
