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

export interface BookDto {
  readonly slug: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  readonly deuterocanonical: boolean;
  readonly order: number;
  readonly chapterCount: number;
}

export interface BookSummaryDto {
  readonly slug: string;
  readonly name: string;
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
  readonly translation: Pick<TranslationDto, "code" | "name">;
  readonly book: BookDto;
  readonly chapter: number;
  readonly verses: readonly VerseDto[];
}

export interface VerseDetailDto {
  readonly translation: Pick<TranslationDto, "code" | "name">;
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
  readonly translation: Pick<TranslationDto, "code" | "name"> | null;
  readonly query: string;
  readonly results: readonly VerseSearchHitDto[];
}
