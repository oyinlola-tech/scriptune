import { canonicalBookAt } from "../../utils/text/bibleBook.helper.js";
import type {
  ContributorModel,
  HymnalEntryListingModel,
  HymnalModel,
  HymnalPlacement,
  HymnDetailModel,
  HymnSearchHit,
  HymnSummaryModel,
  HymnTextModel,
  ScriptureReferenceModel,
} from "../../models/index.js";
import type {
  ContributorDto,
  HymnalDto,
  HymnalEntryDto,
  HymnDetailDto,
  HymnPlacementDto,
  HymnSearchHitDto,
  HymnSummaryDto,
  HymnTextDto,
  PageDto,
  ScriptureReferenceDto,
} from "./hymn.dto.js";

export function toHymnTextDto(text: HymnTextModel): HymnTextDto {
  return {
    language: text.language,
    variant: text.variant,
    title: text.title,
    firstLine: text.firstLine,
    stanzas: text.stanzas,
    rightsStatus: text.rightsStatus,
  };
}

export function toContributorDto(contributor: ContributorModel): ContributorDto {
  const { person } = contributor;
  const years =
    person.birthYear === null && person.deathYear === null
      ? undefined
      : `${person.birthYear ?? "?"}–${person.deathYear ?? ""}`;
  return { role: contributor.role, name: person.name, slug: person.slug, ...(years === undefined ? {} : { years }) };
}

export function toPlacementDto(placement: HymnalPlacement): HymnPlacementDto {
  return {
    hymnal: { slug: placement.hymnal.slug, title: placement.hymnal.title },
    number: placement.number,
    ...(placement.section === null ? {} : { section: placement.section }),
  };
}

export function formatScriptureReference(reference: ScriptureReferenceModel): string {
  const book = canonicalBookAt(reference.bookId)?.name ?? `Book ${reference.bookId}`;
  if (reference.verseStart === null) {
    return `${book} ${reference.chapter}`;
  }
  const range = reference.verseEnd === null || reference.verseEnd === reference.verseStart ? `${reference.verseStart}` : `${reference.verseStart}-${reference.verseEnd}`;
  return `${book} ${reference.chapter}:${range}`;
}

export function toScriptureReferenceDto(reference: ScriptureReferenceModel): ScriptureReferenceDto {
  return {
    reference: formatScriptureReference(reference),
    book: canonicalBookAt(reference.bookId)?.slug ?? String(reference.bookId),
    chapter: reference.chapter,
    verseStart: reference.verseStart,
    verseEnd: reference.verseEnd,
    ...(reference.note === null ? {} : { note: reference.note }),
  };
}

export function toHymnDetailDto(hymn: HymnDetailModel): HymnDetailDto {
  return {
    slug: hymn.slug,
    title: hymn.canonicalTitle,
    alternateTitles: hymn.alternateTitles,
    year: hymn.year,
    meter: hymn.meter,
    tuneName: hymn.tuneName,
    rightsStatus: hymn.rightsStatus,
    texts: hymn.texts.map(toHymnTextDto),
    contributors: hymn.contributors.map(toContributorDto),
    placements: hymn.placements.map(toPlacementDto),
    topics: hymn.topics.map((topic) => ({ slug: topic.slug, name: topic.name })),
    scriptureReferences: hymn.scriptureReferences.map(toScriptureReferenceDto),
  };
}

export function toHymnSummaryDto(hymn: HymnSummaryModel): HymnSummaryDto {
  return {
    slug: hymn.slug,
    title: hymn.canonicalTitle,
    firstLine: hymn.firstLine,
    language: hymn.language,
    placements: hymn.placements.map((placement) => ({
      hymnal: { slug: placement.hymnalSlug, title: placement.hymnalTitle },
      number: placement.number,
    })),
  };
}

export function toHymnSearchHitDto(hit: HymnSearchHit): HymnSearchHitDto {
  return {
    slug: hit.slug,
    title: hit.title,
    firstLine: hit.firstLine,
    language: hit.language,
    score: Math.round(hit.score * 1000) / 1000,
    excerpt: hit.normalizedLyrics,
  };
}

/** Drops fields that exist only for the recognizer before a hit goes public. */
export function toPublicHymnSearchHitDto(hit: HymnSearchHitDto): HymnSearchHitDto {
  const { excerpt: _excerpt, ...rest } = hit;
  return rest;
}

export function toHymnalDto(hymnal: HymnalModel, entryCount: number): HymnalDto {
  return {
    slug: hymnal.slug,
    title: hymnal.title,
    edition: hymnal.edition,
    year: hymnal.year,
    publisher: hymnal.publisher,
    description: hymnal.description,
    rightsStatus: hymnal.rightsStatus,
    entryCount,
  };
}

export function toHymnalEntryDto(entry: HymnalEntryListingModel): HymnalEntryDto {
  return {
    number: entry.number,
    ...(entry.section === null ? {} : { section: entry.section }),
    hymn: { slug: entry.hymnSlug, title: entry.title, firstLine: entry.firstLine },
  };
}

export function toPageDto<T>(items: readonly T[], page: number, limit: number, total: number): PageDto<T> {
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
