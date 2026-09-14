import { QueryHandler } from "@zudojs/cqrs";
import { toCollectionSummaryDto, type CollectionDto } from "../../../../dtos/index.js";
import type { CollectionRepository } from "../../../../repositories/index.js";
import { LIST_COLLECTIONS, type ListCollectionsQuery } from "./listCollections.query.js";

export class ListCollectionsHandler extends QueryHandler<ListCollectionsQuery, readonly CollectionDto[]> {
  public readonly queryType = LIST_COLLECTIONS;

  private readonly collections: CollectionRepository;

  public constructor(collections: CollectionRepository) {
    super();
    this.collections = collections;
  }

  public async execute(query: ListCollectionsQuery): Promise<readonly CollectionDto[]> {
    const collections = await this.collections.list(query.userId);
    return collections.map(toCollectionSummaryDto);
  }
}
