import { CommandHandler } from "@zudojs/cqrs";
import type { HistoryRepository } from "../../../../repositories/index.js";
import { CLEAR_HISTORY, type ClearHistoryCommand } from "./clearHistory.command.js";

export class ClearHistoryHandler extends CommandHandler<ClearHistoryCommand, number> {
  public readonly commandType = CLEAR_HISTORY;

  private readonly history: HistoryRepository;

  public constructor(history: HistoryRepository) {
    super();
    this.history = history;
  }

  public async execute(command: ClearHistoryCommand): Promise<number> {
    return this.history.clear(command.userId);
  }
}
