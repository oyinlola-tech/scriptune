import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toCollectionItemDto, type CollectionItemDto } from "../../../../dtos/index.js";
import type { CollectionRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { ADD_COLLECTION_ITEM, type AddCollectionItemCommand } from "./addCollectionItem.command.js";

export class AddCollectionItemHandler extends CommandHandler<AddCollectionItemCommand, CollectionItemDto> {
  public readonly commandType = ADD_COLLECTION_ITEM;

  private readonly collections: CollectionRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(collections: CollectionRepository, resolver: LibraryTargetResolver) {
    super();
    this.collections = collections;
    this.resolver = resolver;
  }

  public async execute(command: AddCollectionItemCommand): Promise<CollectionItemDto> {
    const { userId, slug, target, note } = command.input;
    const collection = await this.collections.findBySlug(userId, slug);
    if (collection === null) {
      throw new NotFoundError(`Collection "${slug}" was not found.`);
    }
    const item = await this.collections.addItem(collection.id, target, note ?? null);
    return toCollectionItemDto(item, await this.resolver.resolve([item]));
  }
}
