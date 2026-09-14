import type { TestamentName } from "../../constants/bible.books.js";

/** A book in a corpus export; verses point at it by `order`. */
export interface BibleExportBookDto {
  readonly order: number;
  readonly slug: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  readonly deuterocanonical: boolean;
  readonly chapterCount: number;
}

/** One verse as `[bookOrder, chapter, verse, text]`, kept compact for a 31,000-row download. */
export type BibleExportVerseRow = readonly [number, number, number, string];

/**
 * A whole translation, for clients that keep a local copy and read or
 * search it offline.
 */
export interface BibleExportDto {
  readonly translation: { readonly code: string; readonly name: string; readonly language: string; readonly rightsStatus: string };
  readonly generatedAt: string;
  readonly verseCount: number;
  readonly books: readonly BibleExportBookDto[];
  readonly verses: readonly BibleExportVerseRow[];
}
