import { QueryHandler } from "@zudojs/cqrs";
import { toHymnDetailDto, type HymnDetailDto } from "../../../../dtos/index.js";
import type { HymnLookup } from "../../../../services/hymns/index.js";
import { GET_HYMN, type GetHymnQuery } from "./getHymn.query.js";

export class GetHymnHandler extends QueryHandler<GetHymnQuery, HymnDetailDto> {
  public readonly queryType = GET_HYMN;

  private readonly lookup: HymnLookup;

  public constructor(lookup: HymnLookup) {
    super();
    this.lookup = lookup;
  }

  public async execute(query: GetHymnQuery): Promise<HymnDetailDto> {
    return toHymnDetailDto(await this.lookup.requireHymn(query.slug));
  }
}
