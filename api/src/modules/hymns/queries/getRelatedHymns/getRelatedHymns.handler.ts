import { QueryHandler } from "@zudojs/cqrs";
import type { RelatedHymnsDto } from "../../../../dtos/index.js";
import type { HymnLinkRepository } from "../../../../repositories/index.js";
import type { HymnLookup } from "../../../../services/hymns/index.js";
import { GET_RELATED_HYMNS, type GetRelatedHymnsQuery } from "./getRelatedHymns.query.js";

export class GetRelatedHymnsHandler extends QueryHandler<GetRelatedHymnsQuery, RelatedHymnsDto> {
  public readonly queryType = GET_RELATED_HYMNS;

  private readonly lookup: HymnLookup;
  private readonly links: HymnLinkRepository;

  public constructor(lookup: HymnLookup, links: HymnLinkRepository) {
    super();
    this.lookup = lookup;
    this.links = links;
  }

  public async execute(query: GetRelatedHymnsQuery): Promise<RelatedHymnsDto> {
    const hymn = await this.lookup.requireHymn(query.slug);
    return { slug: hymn.slug, related: await this.links.findRelatedHymns(hymn.id, query.limit) };
  }
}
