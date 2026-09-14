import type { LibraryTargetType } from "./types";

/** A parsed library verse key such as "KJV:john:3:16". */
export interface VerseKeyParts {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
}

/** Builds the verse key the library uses, e.g. "KJV:john:3:16". */
export function verseKey(translation: string, book: string, chapter: number, verse: number): string {
  return `${translation.toUpperCase()}:${book}:${chapter}:${verse}`;
}

/** Parses a verse key back into its parts, or null when malformed. */
export function parseVerseKey(key: string): VerseKeyParts | null {
  const parts = key.split(":");
  if (parts.length !== 4) return null;
  const [translation, book, chapterText, verseText] = parts as [string, string, string, string];
  const chapter = Number(chapterText);
  const verse = Number(verseText);
  if (translation === "" || book === "" || !Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || verse < 1) return null;
  return { translation: translation.toUpperCase(), book, chapter, verse };
}

/** The app path that opens a library target. */
export function targetPath(type: LibraryTargetType, key: string): string {
  if (type === "hymn") return `/hymns/${key}`;
  const parts = parseVerseKey(key);
  if (parts === null) return "/bible";
  return `/bible/${parts.translation.toLowerCase()}/${parts.book}/${parts.chapter}/${parts.verse}`;
}
