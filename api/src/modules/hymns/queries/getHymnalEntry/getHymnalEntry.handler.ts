import { QueryHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toHymnDetailDto, type HymnDetailDto } from "../../../../dtos/index.js";
import type { HymnalRepository } from "../../../../repositories/index.js";
import type { HymnLookup } from "../../../../services/hymns/index.js";
import { GET_HYMNAL_ENTRY, type GetHymnalEntryQuery } from "./getHymnalEntry.query.js";

export class GetHymnalEntryHandler extends QueryHandler<GetHymnalEntryQuery, HymnDetailDto> {
  public readonly queryType = GET_HYMNAL_ENTRY;

  private readonly lookup: HymnLookup;
  private readonly hymnals: HymnalRepository;

  public constructor(lookup: HymnLookup, hymnals: HymnalRepository) {
    super();
    this.lookup = lookup;
    this.hymnals = hymnals;
  }

  public async execute(query: GetHymnalEntryQuery): Promise<HymnDetailDto> {
    const hymnal = await this.lookup.requireHymnal(query.hymnal);
    const entry = await this.hymnals.findEntry(hymnal.id, query.number);
    if (entry === null) {
      throw new NotFoundError(`${hymnal.title} has no hymn number ${query.number}.`);
    }
    return toHymnDetailDto(await this.lookup.requireHymn(entry.hymnSlug));
  }
}
