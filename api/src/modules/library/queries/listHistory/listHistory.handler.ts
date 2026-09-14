import { QueryHandler } from "@zudojs/cqrs";
import { toHistoryEntryDto, type HistoryEntryDto } from "../../../../dtos/index.js";
import type { LibraryTarget } from "../../../../models/index.js";
import type { HistoryRepository } from "../../../../repositories/index.js";
import type { LibraryTargetResolver } from "../../../../services/library/index.js";
import { LIST_HISTORY, type ListHistoryQuery } from "./listHistory.query.js";

export class ListHistoryHandler extends QueryHandler<ListHistoryQuery, readonly HistoryEntryDto[]> {
  public readonly queryType = LIST_HISTORY;

  private readonly history: HistoryRepository;
  private readonly resolver: LibraryTargetResolver;

  public constructor(history: HistoryRepository, resolver: LibraryTargetResolver) {
    super();
    this.history = history;
    this.resolver = resolver;
  }

  public async execute(query: ListHistoryQuery): Promise<readonly HistoryEntryDto[]> {
    const entries = await this.history.list(query.userId, query.limit);
    const targets: LibraryTarget[] = entries.flatMap((entry) =>
      entry.targetType !== null && entry.targetKey !== null ? [{ targetType: entry.targetType, targetKey: entry.targetKey }] : [],
    );
    const resolved = await this.resolver.resolve(targets);
    return entries.map((entry) => toHistoryEntryDto(entry, resolved));
  }
}
