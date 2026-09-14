export type LibraryTargetTypeName = "HYMN" | "VERSE";
export type HistoryKindName = "IDENTIFY" | "SEARCH" | "VIEW";

/** Something a member can save, collect or annotate: a hymn slug or a verse key. */
export interface LibraryTarget {
  readonly targetType: LibraryTargetTypeName;
  readonly targetKey: string;
}

export interface SavedItemModel extends LibraryTarget {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
}

export interface CollectionModel {
  readonly id: string;
  readonly userId: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CollectionItemModel extends LibraryTarget {
  readonly id: string;
  readonly collectionId: string;
  readonly position: number;
  readonly note: string | null;
  readonly createdAt: Date;
}

export interface CollectionWithItemsModel extends CollectionModel {
  readonly items: readonly CollectionItemModel[];
}

export interface CollectionSummaryModel extends CollectionModel {
  readonly itemCount: number;
}

export interface NoteModel extends LibraryTarget {
  readonly id: string;
  readonly userId: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface HistoryEntryModel {
  readonly id: string;
  readonly userId: string;
  readonly kind: HistoryKindName;
  readonly mode: string | null;
  readonly query: string;
  readonly targetType: LibraryTargetTypeName | null;
  readonly targetKey: string | null;
  readonly attemptId: string | null;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}
