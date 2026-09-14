import type { Stanza } from "../../models/index.js";

/**
 * Repairs the recurring OCR artifacts of the dataset: spaces before
 * punctuation, broken hyphens, runs of dashes, stray quotes and brackets.
 */
export function cleanLyricLine(line: string): string {
  return line
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

function isStanzaNumber(line: string): boolean {
  return /^\s*\d{1,2}\s*$/.test(line);
}

/**
 * Splits raw lyric text into stanzas. Blank lines separate blocks, a block
 * holding only a number labels the next block, and tab-indented blocks are
 * choruses.
 */
export function splitStanzas(lyric: string): readonly Stanza[] {
  const stanzas: Stanza[] = [];
  let pendingNumber: number | null = null;
  let verseCount = 0;
  const blocks = lyric.replace(/\r/g, "").split(/\n(?:[ \t]*\n)+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => !isBlank(line));
    if (lines.length === 0) {
      continue;
    }
    if (lines.length === 1 && isStanzaNumber(lines[0] ?? "")) {
      pendingNumber = Number(lines[0]);
      continue;
    }
    const numberLine = lines[0] !== undefined && isStanzaNumber(lines[0]) ? lines.shift() : undefined;
    const kind: Stanza["kind"] = lines.every((line) => line.startsWith("\t")) ? "chorus" : "verse";
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
