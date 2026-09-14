import { CommandHandler } from "@zudojs/cqrs";
import type { SavedItemRepository } from "../../../../repositories/index.js";
import { UNSAVE_ITEM, type UnsaveItemCommand } from "./unsaveItem.command.js";

export class UnsaveItemHandler extends CommandHandler<UnsaveItemCommand, boolean> {
  public readonly commandType = UNSAVE_ITEM;

  private readonly saved: SavedItemRepository;

  public constructor(saved: SavedItemRepository) {
    super();
    this.saved = saved;
  }

  public async execute(command: UnsaveItemCommand): Promise<boolean> {
    return this.saved.remove(command.userId, command.target);
  }
}
