import type { CollectionItemModel, CollectionModel, CollectionSummaryModel, HistoryEntryModel, LibraryTarget, NoteModel, SavedItemModel } from "../../models/index.js";
import { toHistoryKindDto, toTypeDto, type CollectionDto, type CollectionItemDto, type HistoryEntryDto, type LibraryTargetDto, type NoteDto, type SavedItemDto } from "./library.dto.js";

export type ResolvedTargets = ReadonlyMap<string, LibraryTargetDto>;

export function targetIdOf(target: LibraryTarget): string {
  return `${target.targetType}:${target.targetKey}`;
}

/** Falls back to an unresolved target when the content no longer exists. */
export function resolvedTarget(target: LibraryTarget, resolved: ResolvedTargets): LibraryTargetDto {
  return resolved.get(targetIdOf(target)) ?? { type: toTypeDto(target.targetType), key: target.targetKey, hymn: null, verse: null };
}

export function toSavedItemDto(item: SavedItemModel, resolved: ResolvedTargets): SavedItemDto {
  return { target: resolvedTarget(item, resolved), savedAt: item.createdAt.toISOString() };
}

export function toCollectionDto(collection: CollectionModel, itemCount: number): CollectionDto {
  return {
    slug: collection.slug,
    name: collection.name,
    description: collection.description,
    itemCount,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

export function toCollectionSummaryDto(collection: CollectionSummaryModel): CollectionDto {
  return toCollectionDto(collection, collection.itemCount);
}

export function toCollectionItemDto(item: CollectionItemModel, resolved: ResolvedTargets): CollectionItemDto {
  return { target: resolvedTarget(item, resolved), position: item.position, note: item.note, addedAt: item.createdAt.toISOString() };
}

export function toNoteDto(note: NoteModel, resolved: ResolvedTargets): NoteDto {
  return { target: resolvedTarget(note, resolved), body: note.body, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() };
}

export function toHistoryEntryDto(entry: HistoryEntryModel, resolved: ResolvedTargets): HistoryEntryDto {
  const target = entry.targetType !== null && entry.targetKey !== null ? { targetType: entry.targetType, targetKey: entry.targetKey } : null;
  return {
    id: entry.id,
    kind: toHistoryKindDto(entry.kind),
    mode: entry.mode,
    query: entry.query,
    target: target === null ? null : resolvedTarget(target, resolved),
    attemptId: entry.attemptId,
    occurredAt: entry.occurredAt.toISOString(),
  };
}
