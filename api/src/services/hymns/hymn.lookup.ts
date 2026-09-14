import { NotFoundError } from "@zudojs/errors";
import type { HymnDetailModel } from "../../models/index.js";
import type { HymnalRepository, HymnalWithCount, HymnRepository } from "../../repositories/index.js";

/** Resolves hymns and hymnals from slugs, failing with 404s. */
export class HymnLookup {
  private readonly hymns: HymnRepository;
  private readonly hymnals: HymnalRepository;

  public constructor(hymns: HymnRepository, hymnals: HymnalRepository) {
    this.hymns = hymns;
    this.hymnals = hymnals;
  }

  public async requireHymn(slug: string): Promise<HymnDetailModel> {
    const hymn = await this.hymns.findBySlug(slug);
    if (hymn === null) {
      throw new NotFoundError(`Hymn "${slug}" was not found.`);
    }
    return hymn;
  }

  public async requireHymnal(slug: string): Promise<HymnalWithCount> {
    const hymnal = await this.hymnals.findBySlug(slug);
    if (hymnal === null) {
      throw new NotFoundError(`Hymnal "${slug}" was not found.`);
    }
    return hymnal;
  }
}
