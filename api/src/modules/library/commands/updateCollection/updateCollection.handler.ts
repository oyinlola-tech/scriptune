import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toCollectionDto, type CollectionDto } from "../../../../dtos/index.js";
import type { CollectionRepository } from "../../../../repositories/index.js";
import { UPDATE_COLLECTION, type UpdateCollectionCommand } from "./updateCollection.command.js";

export class UpdateCollectionHandler extends CommandHandler<UpdateCollectionCommand, CollectionDto> {
  public readonly commandType = UPDATE_COLLECTION;

  private readonly collections: CollectionRepository;

  public constructor(collections: CollectionRepository) {
    super();
    this.collections = collections;
  }

  public async execute(command: UpdateCollectionCommand): Promise<CollectionDto> {
    const { userId, slug, name, description } = command.input;
    const existing = await this.collections.findBySlug(userId, slug);
    if (existing === null) {
      throw new NotFoundError(`Collection "${slug}" was not found.`);
    }
    const updated = await this.collections.update(existing.id, {
      ...(name === undefined ? {} : { name }),
      ...(description === undefined ? {} : { description }),
    });
    return toCollectionDto(updated, existing.items.length);
  }
}
