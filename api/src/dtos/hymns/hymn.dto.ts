import type { ContributorRoleName, Stanza } from "../../models/index.js";

export interface HymnalSummaryDto {
  readonly slug: string;
  readonly title: string;
}

export interface HymnPlacementDto {
  readonly hymnal: HymnalSummaryDto;
  readonly number: number;
  readonly section?: string;
}

export interface HymnSummaryDto {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
  readonly language: string | null;
  readonly placements: readonly HymnPlacementDto[];
}

export interface HymnTextDto {
  readonly language: string;
  readonly variant: string;
  readonly title: string;
  readonly firstLine: string;
  readonly stanzas: readonly Stanza[];
  readonly rightsStatus: string;
}

export interface ContributorDto {
  readonly role: ContributorRoleName;
  readonly name: string;
  readonly slug: string;
  readonly years?: string;
}

export interface TopicDto {
  readonly slug: string;
  readonly name: string;
}

export interface ScriptureReferenceDto {
  /** Human reference such as "Psalm 103:1-5". */
  readonly reference: string;
  readonly book: string;
  readonly chapter: number;
  readonly verseStart: number | null;
  readonly verseEnd: number | null;
  readonly note?: string;
}

export interface HymnDetailDto {
  readonly slug: string;
  readonly title: string;
  readonly alternateTitles: readonly string[];
  readonly year: number | null;
  readonly meter: string | null;
  readonly tuneName: string | null;
  readonly rightsStatus: string;
  readonly texts: readonly HymnTextDto[];
  readonly contributors: readonly ContributorDto[];
  readonly placements: readonly HymnPlacementDto[];
  readonly topics: readonly TopicDto[];
  readonly scriptureReferences: readonly ScriptureReferenceDto[];
}

export interface HymnSearchHitDto {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string;
  readonly language: string;
  readonly score: number;
  /** Normalized lyric text; present for the recognizer, stripped from public responses. */
  readonly excerpt?: string;
}

export interface HymnalDto extends HymnalSummaryDto {
  readonly edition: string | null;
  readonly year: number | null;
  readonly publisher: string | null;
  readonly description: string | null;
  readonly rightsStatus: string;
  readonly entryCount: number;
}

export interface HymnalEntryDto {
  readonly number: number;
  readonly section?: string;
  readonly hymn: { readonly slug: string; readonly title: string; readonly firstLine: string | null };
}

export interface PageDto<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/** A hymn worth reading after another, with the reason the two are paired. */
export interface RelatedHymnDto {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
  /** "Both draw on Psalm 23", or "Similar words". */
  readonly reason: string;
}

export interface RelatedHymnsDto {
  readonly slug: string;
  readonly related: readonly RelatedHymnDto[];
}
