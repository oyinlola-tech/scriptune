import type { HymnalEntryModel, HymnalModel } from "./hymnal.model.js";
import type { ContributorModel, ScriptureReferenceModel, TopicModel } from "./hymnRelation.model.js";
import type { HymnTextModel } from "./hymnText.model.js";

export interface HymnModel {
  readonly id: string;
  readonly slug: string;
  readonly importKey: string | null;
  readonly canonicalTitle: string;
  readonly year: number | null;
  readonly meter: string | null;
  readonly tuneName: string | null;
  readonly rightsStatus: string;
  readonly sourceId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A hymnal entry together with the hymnal it belongs to. */
export interface HymnalPlacement extends HymnalEntryModel {
  readonly hymnal: HymnalModel;
}

/** A hymn with everything a hymn page needs. */
export interface HymnDetailModel extends HymnModel {
  readonly texts: readonly HymnTextModel[];
  readonly alternateTitles: readonly string[];
  readonly contributors: readonly ContributorModel[];
  readonly placements: readonly HymnalPlacement[];
  readonly topics: readonly TopicModel[];
  readonly scriptureReferences: readonly ScriptureReferenceModel[];
}

/** The fields a list or search result needs. */
export interface HymnSummaryModel {
  readonly id: string;
  readonly slug: string;
  readonly canonicalTitle: string;
  readonly firstLine: string | null;
  readonly language: string | null;
  readonly placements: readonly { readonly hymnalSlug: string; readonly hymnalTitle: string; readonly number: number }[];
}
