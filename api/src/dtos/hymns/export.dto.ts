import type { Stanza } from "../../models/index.js";

/** One hymn of a hymnal export, with its primary text inline. */
export interface HymnalExportHymnDto {
  readonly number: number;
  readonly slug: string;
  readonly title: string;
  readonly language: string;
  readonly firstLine: string;
  readonly stanzas: readonly Stanza[];
}

/** A whole hymnal, for clients that keep a local copy and read or search it offline. */
export interface HymnalExportDto {
  readonly hymnal: { readonly slug: string; readonly title: string; readonly edition: string | null; readonly year: number | null; readonly rightsStatus: string };
  readonly generatedAt: string;
  readonly hymnCount: number;
  readonly hymns: readonly HymnalExportHymnDto[];
}
