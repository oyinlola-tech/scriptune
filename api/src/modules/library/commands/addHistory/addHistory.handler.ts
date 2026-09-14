import { CommandHandler } from "@zudojs/cqrs";
import { HISTORY_RETENTION } from "../../../../constants/app.constants.js";
import type { HistoryRepository } from "../../../../repositories/index.js";
import { ADD_HISTORY, type AddHistoryCommand } from "./addHistory.command.js";

export interface AddHistoryResult {
  readonly added: number;
  readonly trimmed: number;
}

export class AddHistoryHandler extends CommandHandler<AddHistoryCommand, AddHistoryResult> {
  public readonly commandType = ADD_HISTORY;

  private readonly history: HistoryRepository;

  public constructor(history: HistoryRepository) {
    super();
    this.history = history;
  }

  public async execute(command: AddHistoryCommand): Promise<AddHistoryResult> {
    const added = await this.history.add(command.userId, command.entries);
    const trimmed = await this.history.trim(command.userId, HISTORY_RETENTION);
    return { added, trimmed };
  }
}
