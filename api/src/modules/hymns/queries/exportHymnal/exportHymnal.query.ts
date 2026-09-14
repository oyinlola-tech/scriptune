import { Query } from "@zudojs/cqrs";

export const EXPORT_HYMNAL = "hymns.exportHymnal" as const;

/** Reads a whole hymnal with its words for offline clients. */
export class ExportHymnalQuery extends Query<typeof EXPORT_HYMNAL> {
  public readonly slug: string;

  public constructor(slug: string) {
    super(EXPORT_HYMNAL);
    this.slug = slug;
  }
}
