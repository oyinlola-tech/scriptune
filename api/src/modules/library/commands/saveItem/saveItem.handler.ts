import { CommandHandler } from "@zudojs/cqrs";
import { toSavedItemDto, type SavedItemDto } from "../../../../dtos/index.js";
import type { SavedItemRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { SAVE_ITEM, type SaveItemCommand } from "./saveItem.command.js";

export class SaveItemHandler extends CommandHandler<SaveItemCommand, SavedItemDto> {
  public readonly commandType = SAVE_ITEM;

  private readonly saved: SavedItemRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(saved: SavedItemRepository, resolver: LibraryTargetResolver) {
    super();
    this.saved = saved;
    this.resolver = resolver;
  }

  public async execute(command: SaveItemCommand): Promise<SavedItemDto> {
    const item = await this.saved.save(command.userId, command.target);
    return toSavedItemDto(item, await this.resolver.resolve([item]));
  }
}
