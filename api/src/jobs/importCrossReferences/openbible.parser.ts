import { ValidationError } from "@zudojs/errors";
import type { CrossReferenceInput } from "../../repositories/index.js";

/** OSIS book abbreviations used by the dataset, in canonical order (index = book id - 1). */
export const OSIS_CODES = [
  "Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", "1Sam", "2Sam", "1Kgs", "2Kgs", "1Chr", "2Chr", "Ezra", "Neh", "Esth", "Job", "Ps", "Prov",
  "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek", "Dan", "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1Cor", "2Cor", "Gal", "Eph", "Phil", "Col", "1Thess", "2Thess", "1Tim", "2Tim", "Titus", "Phlm", "Heb", "Jas",
  "1Pet", "2Pet", "1John", "2John", "3John", "Jude", "Rev",
] as const;

const BOOK_ID = new Map<string, number>(OSIS_CODES.map((code, index) => [code, index + 1]));
const VERSE = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/;

interface VerseRef { readonly bookId: number; readonly chapter: number; readonly verse: number }

function parseVerse(text: string): VerseRef | null {
  const match = VERSE.exec(text);
  const bookId = match === null ? undefined : BOOK_ID.get(match[1] ?? "");
  return match === null || bookId === undefined ? null : { bookId, chapter: Number(match[2]), verse: Number(match[3]) };
}

export interface OpenBibleParseOptions {
  /** Links below this many votes are dropped; readers voted them unhelpful or never confirmed them. */
  readonly minVotes: number;
  /** The strongest links kept for each verse. */
  readonly perVerse: number;
}

/**
 * Parses OpenBible.info's tab-separated cross-references
 * (`Gen.1.1<TAB>Prov.8.22-Prov.8.30<TAB>76`). A passage that runs into another
 * chapter is kept as its first verse alone.
 */
export function parseOpenBibleCrossReferences(text: string, options: OpenBibleParseOptions): readonly CrossReferenceInput[] {
  const bySource = new Map<string, CrossReferenceInput[]>();
  for (const line of text.split(/\r?\n/)) {
    const [fromText, toText, votesText] = line.split("\t");
    if (fromText === undefined || toText === undefined || votesText === undefined) continue;
    const votes = Number.parseInt(votesText, 10);
    if (!Number.isFinite(votes) || votes < options.minVotes) continue;
    const from = parseVerse(fromText);
    const [startText, endText] = toText.split("-");
    const start = parseVerse(startText ?? "");
    if (from === null || start === null) continue;
    const end = endText === undefined ? null : parseVerse(endText);
    const sameChapter = end !== null && end.bookId === start.bookId && end.chapter === start.chapter && end.verse > start.verse;
    const key = `${from.bookId}.${from.chapter}.${from.verse}`;
    const rows = bySource.get(key) ?? [];
    rows.push({ fromBookId: from.bookId, fromChapter: from.chapter, fromVerse: from.verse, toBookId: start.bookId, toChapter: start.chapter, toVerseStart: start.verse, toVerseEnd: sameChapter ? end.verse : start.verse, votes });
    bySource.set(key, rows);
  }
  if (bySource.size === 0) {
    throw new ValidationError("No cross-references were found in the dataset.");
  }
  const kept: CrossReferenceInput[] = [];
  for (const rows of bySource.values()) {
    rows.sort((a, b) => b.votes - a.votes);
    const seen = new Set<string>();
    for (const row of rows) {
      const target = `${row.toBookId}.${row.toChapter}.${row.toVerseStart}`;
      if (seen.has(target)) continue;
      seen.add(target);
      kept.push(row);
      if (seen.size === options.perVerse) break;
    }
  }
  return kept;
}
