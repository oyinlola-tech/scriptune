import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import type { CollectionRepository } from "../../../../repositories/index.js";
import { DELETE_COLLECTION, type DeleteCollectionCommand } from "./deleteCollection.command.js";

export class DeleteCollectionHandler extends CommandHandler<DeleteCollectionCommand, void> {
  public readonly commandType = DELETE_COLLECTION;

  private readonly collections: CollectionRepository;

  public constructor(collections: CollectionRepository) {
    super();
    this.collections = collections;
  }

  public async execute(command: DeleteCollectionCommand): Promise<void> {
    const existing = await this.collections.findBySlug(command.userId, command.slug);
    if (existing === null) {
      throw new NotFoundError(`Collection "${command.slug}" was not found.`);
    }
    await this.collections.remove(existing.id);
  }
}
