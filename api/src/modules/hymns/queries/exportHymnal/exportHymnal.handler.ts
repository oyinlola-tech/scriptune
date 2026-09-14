import { QueryHandler } from "@zudojs/cqrs";
import type { HymnalExportDto } from "../../../../dtos/index.js";
import type { HymnalRepository } from "../../../../repositories/index.js";
import type { HymnLookup } from "../../../../services/hymns/index.js";
import { EXPORT_HYMNAL, type ExportHymnalQuery } from "./exportHymnal.query.js";

export class ExportHymnalHandler extends QueryHandler<ExportHymnalQuery, HymnalExportDto> {
  public readonly queryType = EXPORT_HYMNAL;

  private readonly lookup: HymnLookup;
  private readonly hymnals: HymnalRepository;

  public constructor(lookup: HymnLookup, hymnals: HymnalRepository) {
    super();
    this.lookup = lookup;
    this.hymnals = hymnals;
  }

  public async execute(query: ExportHymnalQuery): Promise<HymnalExportDto> {
    const hymnal = await this.lookup.requireHymnal(query.slug);
    const hymns = await this.hymnals.listEntriesWithTexts(hymnal.id);
    return {
      hymnal: { slug: hymnal.slug, title: hymnal.title, edition: hymnal.edition, year: hymnal.year, rightsStatus: hymnal.rightsStatus },
      generatedAt: new Date().toISOString(),
      hymnCount: hymns.length,
      hymns,
    };
  }
}
