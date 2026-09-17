import type { TestamentName } from "../../constants/bible.books.js";

export interface BookModel {
  /** Canonical order, 1 to 73. */
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  readonly deuterocanonical: boolean;
  /** Chapters in this translation when read for one, otherwise the most any translation has. */
  readonly chapterCount: number;
  /** The name in a translation's own language, present only when read for such a translation. */
  readonly localName?: string | null;
}
