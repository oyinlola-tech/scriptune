import { ValidationError } from "@zudojs/errors";
import { CANONICAL_BOOKS, PROTESTANT_BOOK_COUNT } from "../../constants/bible.books.js";
import type { ImportBookInput } from "../../modules/bible/commands/index.js";
import { cleanVerseText } from "./scrollmapper.parser.js";

export type CanonName = "protestant" | "catholic";

/** USFM book codes used by eBible.org, in canonical order (index = order - 1). */
export const USFM_CODES = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SOL", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO", "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL",
  "MAT", "MAR", "LUK", "JOH", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHI", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAM",
  "1PE", "2PE", "1JO", "2JO", "3JO", "JUD", "REV", "TOB", "JDT", "WIS", "SIR", "BAR", "1MA", "2MA",
] as const;

/** Greek Esther and Greek Daniel stand in for Esther and Daniel in Catholic editions. */
const GREEK_STAND_INS: Readonly<Record<string, string>> = Object.freeze({ ESG: "EST", DNG: "DAN" });

const LINE = /^([0-9A-Z]{3}) (\d+):(\d+) (.*)$/;

export interface VplParseResult {
  readonly books: readonly ImportBookInput[];
  /** Book codes present in the file but outside the requested canon. */
  readonly skipped: readonly string[];
}

/**
 * Parses eBible.org's verse-per-line text (`GEN 1:1 In the beginning…`).
 * Books outside the canon are skipped and reported. When a Catholic edition
 * carries Greek Esther or Daniel instead of the Hebrew books, those are read
 * as Esther and Daniel.
 */
export function parseVplText(text: string, canon: CanonName): VplParseResult {
  const limit = canon === "catholic" ? CANONICAL_BOOKS.length : PROTESTANT_BOOK_COUNT;
  const orderByCode = new Map<string, number>(USFM_CODES.slice(0, limit).map((code, index) => [code, index + 1]));
  const chaptersByOrder = new Map<number, string[][]>();
  const present = new Set<string>();
  const skipped = new Set<string>();
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  for (const line of lines) {
    const match = LINE.exec(line);
    if (match === null) continue;
    present.add(match[1]!);
  }
  const resolveCode = (code: string): string | null => {
    if (orderByCode.has(code)) return code;
    const standIn = GREEK_STAND_INS[code];
    return standIn !== undefined && canon === "catholic" && !present.has(standIn) ? standIn : null;
  };
  for (const line of lines) {
    const match = LINE.exec(line);
    if (match === null) continue;
    const [, code, chapterText, verseText, body] = match as unknown as [string, string, string, string, string];
    const resolved = resolveCode(code);
    if (resolved === null) {
      skipped.add(code);
      continue;
    }
    const order = orderByCode.get(resolved)!;
    const chapters = chaptersByOrder.get(order) ?? [];
    const chapter = chapters[Number(chapterText) - 1] ?? [];
    chapter[Number(verseText) - 1] = cleanVerseText(body);
    chapters[Number(chapterText) - 1] = chapter;
    chaptersByOrder.set(order, chapters);
  }
  if (chaptersByOrder.size === 0) {
    throw new ValidationError("The verse-per-line file contains no recognisable verses.");
  }
  const books = [...chaptersByOrder.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([order, chapters]) => ({ order, chapters: Array.from(chapters, (chapter) => Array.from(chapter ?? [], (verse) => verse ?? "")) }));
  return { books, skipped: [...skipped].sort() };
}
