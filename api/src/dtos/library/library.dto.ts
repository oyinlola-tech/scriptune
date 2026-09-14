import type { HistoryEntryModel, LibraryTargetTypeName } from "../../models/index.js";

export type LibraryTargetTypeDto = "hymn" | "verse";

export interface HymnTargetDto {
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string | null;
}

export interface VerseTargetDto {
  readonly reference: string;
  readonly translation: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
}

/** A saved or collected target, resolved to its current content when it still exists. */
export interface LibraryTargetDto {
  readonly type: LibraryTargetTypeDto;
  readonly key: string;
  readonly hymn: HymnTargetDto | null;
  readonly verse: VerseTargetDto | null;
}

export interface SavedItemDto {
  readonly target: LibraryTargetDto;
  readonly savedAt: string;
}

export interface CollectionDto {
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly itemCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CollectionItemDto {
  readonly target: LibraryTargetDto;
  readonly position: number;
  readonly note: string | null;
  readonly addedAt: string;
}

export interface CollectionDetailDto extends Omit<CollectionDto, "itemCount"> {
  readonly items: readonly CollectionItemDto[];
}

export interface NoteDto {
  readonly target: LibraryTargetDto;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface HistoryEntryDto {
  readonly id: string;
  readonly kind: "identify" | "search" | "view";
  readonly mode: string | null;
  readonly query: string;
  readonly target: LibraryTargetDto | null;
  readonly attemptId: string | null;
  readonly occurredAt: string;
}

export function toTypeDto(type: LibraryTargetTypeName): LibraryTargetTypeDto {
  return type === "HYMN" ? "hymn" : "verse";
}

export function toHistoryKindDto(kind: HistoryEntryModel["kind"]): HistoryEntryDto["kind"] {
  return kind === "IDENTIFY" ? "identify" : kind === "SEARCH" ? "search" : "view";
}
