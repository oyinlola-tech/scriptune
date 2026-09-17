import type { TestamentName } from "../../constants/bible.books.js";

export interface TranslationDto {
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly description: string | null;
  readonly rightsStatus: string;
  readonly isDefault: boolean;
  readonly verseCount: number;
}

/** What a reading view needs to label a translation and honour its licence. */
export interface TranslationSummaryDto {
  readonly code: string;
  readonly name: string;
  readonly language: string;
  readonly rightsStatus: string;
  /** The copyright notice an open licence requires beside the text; null for public-domain texts. */
  readonly notice: string | null;
}

export interface BookDto {
  readonly slug: string;
  readonly name: string;
  /** The name in the translation's own language ("Saamu"), or null where the English name serves. */
  readonly localName: string | null;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  readonly deuterocanonical: boolean;
  readonly order: number;
  readonly chapterCount: number;
}

export interface BookSummaryDto {
  readonly slug: string;
  readonly name: string;
  readonly localName: string | null;
  readonly abbreviation: string;
}

export interface VerseDto {
  /** Human reference such as "John 3:16". */
  readonly reference: string;
  readonly book: BookSummaryDto;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
}

export interface ChapterDto {
  readonly translation: TranslationSummaryDto;
  readonly book: BookDto;
  readonly chapter: number;
  readonly verses: readonly VerseDto[];
}

export interface VerseDetailDto {
  readonly translation: TranslationSummaryDto;
  readonly verse: VerseDto;
  readonly context: {
    readonly before: readonly VerseDto[];
    readonly after: readonly VerseDto[];
  };
}

export interface VerseSearchHitDto extends VerseDto {
  /** Code of the translation this text comes from, e.g. "KJV". */
  readonly translation: string;
  readonly score: number;
}

export interface VerseSearchResultDto {
  /** The translation searched, or null when every translation was searched. */
  readonly translation: TranslationSummaryDto | null;
  readonly query: string;
  readonly results: readonly VerseSearchHitDto[];
}
