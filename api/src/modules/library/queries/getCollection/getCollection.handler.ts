import { QueryHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toCollectionDto, toCollectionItemDto, type CollectionDetailDto } from "../../../../dtos/index.js";
import type { CollectionRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { GET_COLLECTION, type GetCollectionQuery } from "./getCollection.query.js";

export class GetCollectionHandler extends QueryHandler<GetCollectionQuery, CollectionDetailDto> {
  public readonly queryType = GET_COLLECTION;

  private readonly collections: CollectionRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(collections: CollectionRepository, resolver: LibraryTargetResolver) {
    super();
    this.collections = collections;
    this.resolver = resolver;
  }

  public async execute(query: GetCollectionQuery): Promise<CollectionDetailDto> {
    const collection = await this.collections.findBySlug(query.userId, query.slug);
    if (collection === null) {
      throw new NotFoundError(`Collection "${query.slug}" was not found.`);
    }
    const resolved = await this.resolver.resolve(collection.items);
    const { itemCount: _count, ...summary } = toCollectionDto(collection, collection.items.length);
    return { ...summary, items: collection.items.map((item) => toCollectionItemDto(item, resolved)) };
  }
}
