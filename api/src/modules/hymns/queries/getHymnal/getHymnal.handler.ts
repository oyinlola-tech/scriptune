import { QueryHandler } from "@zudojs/cqrs";
import { toHymnalDto, toHymnalEntryDto, toPageDto, type HymnalDto, type HymnalEntryDto, type PageDto } from "../../../../dtos/index.js";
import type { HymnalRepository } from "../../../../repositories/index.js";
import type { HymnLookup } from "../../../../services/hymns/index.js";
import { GET_HYMNAL, type GetHymnalQuery } from "./getHymnal.query.js";

export interface HymnalPageDto {
  readonly hymnal: HymnalDto;
  readonly entries: PageDto<HymnalEntryDto>;
}

export class GetHymnalHandler extends QueryHandler<GetHymnalQuery, HymnalPageDto> {
  public readonly queryType = GET_HYMNAL;

  private readonly lookup: HymnLookup;
  private readonly hymnals: HymnalRepository;

  public constructor(lookup: HymnLookup, hymnals: HymnalRepository) {
    super();
    this.lookup = lookup;
    this.hymnals = hymnals;
  }

  public async execute(query: GetHymnalQuery): Promise<HymnalPageDto> {
    const hymnal = await this.lookup.requireHymnal(query.slug);
    const entries = await this.hymnals.listEntries(hymnal.id, query.page, query.limit);
    return {
      hymnal: toHymnalDto(hymnal, hymnal.entryCount),
      entries: toPageDto(entries.map(toHymnalEntryDto), query.page, query.limit, hymnal.entryCount),
    };
  }
}
