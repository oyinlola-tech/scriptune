import { badRequest } from "@zudojs/http";
import type { LibraryTarget, LibraryTargetTypeName } from "../../models/index.js";
import { findCanonicalBook } from "../../utils/text/bibleBook.helper.js";

/** Parsed form of a verse key such as "KJV:john:3:16". */
export interface VerseKey {
  readonly translation: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function formatVerseKey(key: VerseKey): string {
  return `${key.translation.toUpperCase()}:${key.book}:${key.chapter}:${key.verse}`;
}

/** Parses and canonicalizes a verse key; undefined when malformed. */
export function parseVerseKey(raw: string): VerseKey | undefined {
  const parts = raw.split(":");
  if (parts.length !== 4) {
    return undefined;
  }
  const [translation, bookRef, chapterText, verseText] = parts as [string, string, string, string];
  const book = findCanonicalBook(bookRef);
  const chapter = Number(chapterText);
  const verse = Number(verseText);
  if (book === undefined || !/^[A-Za-z0-9]{2,12}$/.test(translation) || !Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || verse < 1) {
    return undefined;
  }
  return { translation: translation.toUpperCase(), book: book.slug, chapter, verse };
}

export function toTargetTypeName(type: "hymn" | "verse"): LibraryTargetTypeName {
  return type === "hymn" ? "HYMN" : "VERSE";
}

/** Validates a client-supplied target and returns its canonical form, or answers 400. */
export function toLibraryTarget(type: "hymn" | "verse", key: string): LibraryTarget {
  if (type === "hymn") {
    if (!SLUG_PATTERN.test(key) || key.length > 80) {
      throw badRequest(`"${key}" is not a valid hymn slug.`, { code: "INVALID_TARGET" });
    }
    return { targetType: "HYMN", targetKey: key };
  }
  const parsed = parseVerseKey(key);
  if (parsed === undefined) {
    throw badRequest(`"${key}" is not a valid verse key; expected TRANSLATION:book:chapter:verse.`, { code: "INVALID_TARGET" });
  }
  return { targetType: "VERSE", targetKey: formatVerseKey(parsed) };
}
