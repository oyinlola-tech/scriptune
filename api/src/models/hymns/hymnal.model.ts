export interface HymnalModel {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly edition: string | null;
  readonly year: number | null;
  readonly publisher: string | null;
  readonly description: string | null;
  readonly rightsStatus: string;
  readonly sourceId: string | null;
}

export interface HymnalEntryModel {
  readonly id: string;
  readonly hymnalId: string;
  readonly hymnId: string;
  readonly number: number;
  readonly section: string | null;
}

/** A hymnal entry as shown in a table of contents. */
export interface HymnalEntryListingModel extends HymnalEntryModel {
  readonly hymnSlug: string;
  readonly title: string;
  readonly firstLine: string | null;
}
