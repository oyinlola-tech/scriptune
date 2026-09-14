import { QueryHandler } from "@zudojs/cqrs";
import { toSavedItemDto, type SavedItemDto } from "../../../../dtos/index.js";
import type { SavedItemRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { LIST_SAVED_ITEMS, type ListSavedItemsQuery } from "./listSavedItems.query.js";

export class ListSavedItemsHandler extends QueryHandler<ListSavedItemsQuery, readonly SavedItemDto[]> {
  public readonly queryType = LIST_SAVED_ITEMS;

  private readonly saved: SavedItemRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(saved: SavedItemRepository, resolver: LibraryTargetResolver) {
    super();
    this.saved = saved;
    this.resolver = resolver;
  }

  public async execute(query: ListSavedItemsQuery): Promise<readonly SavedItemDto[]> {
    const items = await this.saved.list(query.userId, query.targetType);
    const resolved = await this.resolver.resolve(items);
    return items.map((item) => toSavedItemDto(item, resolved));
  }
}
