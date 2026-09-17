import type { Stanza } from "../../models/index.js";
import { repairTurnovers } from "./sss.turnover.js";

/** UTF-8 punctuation that the dataset stored as if it were Latin-1. */
const MOJIBAKE: readonly (readonly [RegExp, string])[] = [
  [/â€”|â€“/g, "—"],
  [/â€˜|â€™/g, "'"],
  [/â€œ|â€\u009d|â€/g, '"'],
];

/**
 * Repairs the recurring OCR artifacts of the dataset: spaces before
 * punctuation, broken hyphens, runs of dashes, stray quotes and brackets,
 * mis-encoded dashes and misread exclamation marks.
 */
export function cleanLyricLine(line: string): string {
  return MOJIBAKE.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), line)
    // The dataset's author renamed a field from "content" to "lyric" and the replace reached the hymns.
    .replace(/\blyric\b/g, "content")
    .replace(/^(\s*)content\b/, "$1Content")
    // A lone "1" after a word is an exclamation mark the scanner misread.
    .replace(/([A-Za-z]) 1(?=\s|"|$)/g, "$1!")
    // At the head of a line the scanner read "I" as 1 and "O" as 0.
    .replace(/^(\s*)1 (?=[a-z])/, "$1I ")
    .replace(/^(\s*)0 (?=[a-z])/, "$1O ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\[|\]/g, "")
    .replace(/-{2,}/g, "—")
    .replace(/(\w)- (\w)/g, "$1-$2")
    .replace(/\s+([;:!?,.])/g, "$1")
    .replace(/([!?;:])(?=[A-Z])/g, "$1 ")
    .replace(/\s+"\s*$/, "")
    .replace(/^"\s*(?=[A-Z])/, "")
    .replace(/([.!?])'$/, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cleans a title, which shares the lyric artifacts but must stay on one line. */
export function cleanTitle(title: string): string {
  return cleanLyricLine(title).replace(/[.;:,]+$/, "").trim();
}

function isBlank(line: string): boolean {
  return line.trim() === "";
}

/** "3 Rejoice and be glad": a verse number the dataset left on the verse's first line. */
const INLINE_NUMBER = /^\s*(\d{1,2})\s+(?=["']?[A-Z])/;

function isStanzaNumber(line: string): boolean {
  return /^\s*\d{1,2}\s*$/.test(line);
}

/**
 * Splits raw lyric text into stanzas. Blank lines separate blocks, a block
 * holding only a number labels the next block, and tab-indented blocks, or
 * unnumbered ones among numbered verses, are choruses.
 */
export function splitStanzas(lyric: string): readonly Stanza[] {
  const stanzas: Stanza[] = [];
  let pendingNumber: number | null = null;
  let verseCount = 0;
  const blocks = repairTurnovers(lyric.replace(/\r/g, "").split(/\n(?:[ \t]*\n)+/).map((block) => block.split("\n").filter((line) => !isBlank(line))));
  const numbered = blocks.some((lines) => lines[0] !== undefined && (isStanzaNumber(lines[0]) || INLINE_NUMBER.test(lines[0])));
  for (const lines of blocks) {
    if (lines.length === 0) {
      continue;
    }
    if (lines.length === 1 && isStanzaNumber(lines[0] ?? "")) {
      pendingNumber = Number(lines[0]);
      continue;
    }
    let numberLine = lines[0] !== undefined && isStanzaNumber(lines[0]) ? lines.shift() : undefined;
    const inline = numberLine === undefined ? INLINE_NUMBER.exec(lines[0] ?? "") : null;
    if (inline !== null) {
      numberLine = inline[1];
      lines[0] = (lines[0] ?? "").slice(inline[0].length);
    }
    // Only some refrains are indented. Where the verses carry numbers, a block without one after verse 1 is the refrain.
    const unnumberedRefrain = numbered && numberLine === undefined && pendingNumber === null && verseCount >= 1;
    const kind: Stanza["kind"] = unnumberedRefrain || lines.every((line) => line.startsWith("\t")) ? "chorus" : "verse";
    const cleaned = lines.map(cleanLyricLine).filter((line) => line !== "");
    if (cleaned.length === 0) {
      continue;
    }
    let number: number | null = null;
    if (kind === "verse") {
      verseCount += 1;
      number = numberLine !== undefined ? Number(numberLine) : (pendingNumber ?? verseCount);
    }
    stanzas.push({ number, kind, lines: cleaned });
    pendingNumber = null;
  }
  return stanzas;
}
