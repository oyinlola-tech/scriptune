import type { BookModel, TranslationModel, VerseModel, VerseSearchHit } from "../../models/index.js";
import type {
  BookDto,
  BookSummaryDto,
  TranslationDto,
  TranslationSummaryDto,
  VerseDto,
  VerseSearchHitDto,
} from "./bible.dto.js";

export function toTranslationDto(model: TranslationModel): TranslationDto {
  return {
    code: model.code,
    name: model.name,
    language: model.language,
    description: model.description,
    rightsStatus: model.rightsStatus,
    isDefault: model.isDefault,
    verseCount: model.verseCount,
  };
}

export function toTranslationSummary(model: TranslationModel): TranslationSummaryDto {
  return {
    code: model.code,
    name: model.name,
    language: model.language,
    rightsStatus: model.rightsStatus,
    notice: model.rightsStatus === "public-domain" ? null : model.description,
  };
}

export function toBookDto(model: BookModel): BookDto {
  return {
    slug: model.slug,
    name: model.name,
    localName: model.localName ?? null,
    abbreviation: model.abbreviation,
    testament: model.testament,
    deuterocanonical: model.deuterocanonical,
    order: model.id,
    chapterCount: model.chapterCount,
  };
}

export function toBookSummary(model: BookModel): BookSummaryDto {
  return { slug: model.slug, name: model.name, localName: model.localName ?? null, abbreviation: model.abbreviation };
}

export function formatReference(book: BookModel, chapter: number, verse?: number): string {
  return verse === undefined ? `${book.name} ${chapter}` : `${book.name} ${chapter}:${verse}`;
}

export function toVerseDto(book: BookModel, verse: VerseModel): VerseDto {
  return {
    reference: formatReference(book, verse.chapter, verse.verse),
    book: toBookSummary(book),
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text,
  };
}

export function toVerseSearchHitDto(book: BookModel, hit: VerseSearchHit, translationCode: string): VerseSearchHitDto {
  return { ...toVerseDto(book, hit), translation: translationCode, score: Math.round(hit.score * 1000) / 1000 };
}
