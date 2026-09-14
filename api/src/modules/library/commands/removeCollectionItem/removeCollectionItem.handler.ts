import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import type { CollectionRepository } from "../../../../repositories/index.js";
import { REMOVE_COLLECTION_ITEM, type RemoveCollectionItemCommand } from "./removeCollectionItem.command.js";

export class RemoveCollectionItemHandler extends CommandHandler<RemoveCollectionItemCommand, boolean> {
  public readonly commandType = REMOVE_COLLECTION_ITEM;

  private readonly collections: CollectionRepository;

  public constructor(collections: CollectionRepository) {
    super();
    this.collections = collections;
  }

  public async execute(command: RemoveCollectionItemCommand): Promise<boolean> {
    const collection = await this.collections.findBySlug(command.userId, command.slug);
    if (collection === null) {
      throw new NotFoundError(`Collection "${command.slug}" was not found.`);
    }
    return this.collections.removeItem(collection.id, command.target);
  }
}
