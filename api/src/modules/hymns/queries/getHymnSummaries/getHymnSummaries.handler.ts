import { QueryHandler } from "@zudojs/cqrs";
import type { HymnTargetDto } from "../../../../dtos/index.js";
import type { HymnRepository } from "../../../../repositories/index.js";
import { GET_HYMN_SUMMARIES, type GetHymnSummariesQuery } from "./getHymnSummaries.query.js";

export class GetHymnSummariesHandler extends QueryHandler<GetHymnSummariesQuery, readonly HymnTargetDto[]> {
  public readonly queryType = GET_HYMN_SUMMARIES;

  private readonly hymns: HymnRepository;

  public constructor(hymns: HymnRepository) {
    super();
    this.hymns = hymns;
  }

  public async execute(query: GetHymnSummariesQuery): Promise<readonly HymnTargetDto[]> {
    if (query.slugs.length === 0) {
      return [];
    }
    const summaries = await this.hymns.findSummariesBySlugs(query.slugs);
    return summaries.map((hymn) => ({ slug: hymn.slug, title: hymn.canonicalTitle, firstLine: hymn.firstLine }));
  }
}
