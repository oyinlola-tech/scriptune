import { isConflictError } from "@zudojs/database";
import { CommandHandler } from "@zudojs/cqrs";
import { ConflictError } from "@zudojs/errors";
import { toCollectionDto, type CollectionDto } from "../../../../dtos/index.js";
import type { CollectionRepository } from "../../../../repositories/index.js";
import { slugify } from "../../../../utils/text/slug.helper.js";
import { CREATE_COLLECTION, type CreateCollectionCommand } from "./createCollection.command.js";

/** Picks a slug the member does not already use. */
export async function allocateCollectionSlug(collections: CollectionRepository, userId: string, name: string): Promise<string> {
  const base = slugify(name, "collection");
  let candidate = base;
  for (let attempt = 2; await collections.slugExists(userId, candidate); attempt += 1) {
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export class CreateCollectionHandler extends CommandHandler<CreateCollectionCommand, CollectionDto> {
  public readonly commandType = CREATE_COLLECTION;

  private readonly collections: CollectionRepository;

  public constructor(collections: CollectionRepository) {
    super();
    this.collections = collections;
  }

  public async execute(command: CreateCollectionCommand): Promise<CollectionDto> {
    const { userId, name, description } = command.input;
    const slug = await allocateCollectionSlug(this.collections, userId, name);
    try {
      const collection = await this.collections.create(userId, { slug, name, description: description ?? null });
      return toCollectionDto(collection, 0);
    } catch (error) {
      if (isConflictError(error)) throw new ConflictError("A collection with this name already exists.");
      throw error;
    }
  }
}
