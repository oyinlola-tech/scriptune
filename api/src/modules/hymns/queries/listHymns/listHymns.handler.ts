import { QueryHandler } from "@zudojs/cqrs";
import { toHymnSummaryDto, toPageDto, type HymnSummaryDto, type PageDto } from "../../../../dtos/index.js";
import type { HymnRepository } from "../../../../repositories/index.js";
import { LIST_HYMNS, type ListHymnsQuery } from "./listHymns.query.js";

export class ListHymnsHandler extends QueryHandler<ListHymnsQuery, PageDto<HymnSummaryDto>> {
  public readonly queryType = LIST_HYMNS;

  private readonly hymns: HymnRepository;

  public constructor(hymns: HymnRepository) {
    super();
    this.hymns = hymns;
  }

  public async execute(query: ListHymnsQuery): Promise<PageDto<HymnSummaryDto>> {
    const { items, total } = await this.hymns.list({
      page: query.page,
      limit: query.limit,
      ...(query.hymnal === undefined ? {} : { hymnalSlug: query.hymnal }),
      ...(query.topic === undefined ? {} : { topicSlug: query.topic }),
      ...(query.language === undefined ? {} : { language: query.language }),
    });
    return toPageDto(items.map(toHymnSummaryDto), query.page, query.limit, total);
  }
}
