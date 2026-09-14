import { ValidationError } from "@zudojs/errors";

/** A hymn as it appears in the dataset, before cleaning. */
export interface RawSssHymn {
  readonly number: number;
  readonly title: string;
  readonly lyric: string;
}

const ENTRY_PATTERN = /Hymns\(\s*id:\s*(\d+),\s*lyric:\s*"((?:[^"\\]|\\.)*)",\s*favorite:\s*\d+,\s*title:\s*"((?:[^"\\]|\\.)*)"/g;

const ESCAPES: Readonly<Record<string, string>> = Object.freeze({
  n: "\n",
  t: "\t",
  r: "",
  '"': '"',
  "'": "'",
  "\\": "\\",
  $: "$",
});

/** Decodes the escape sequences of a Dart double-quoted string literal. */
export function decodeDartString(literal: string): string {
  return literal.replace(/\\(.)/gs, (_, escaped: string) => ESCAPES[escaped] ?? escaped);
}

/**
 * Extracts hymns from the Dart source. Each entry is `Hymns(id: N, lyric:
 * "...", favorite: 0, title: "...")`; nothing else in the file is needed.
 */
export function parseSssDart(source: string): readonly RawSssHymn[] {
  const hymns: RawSssHymn[] = [];
  for (const match of source.matchAll(ENTRY_PATTERN)) {
    const [, id, lyric, title] = match;
    if (id === undefined || lyric === undefined || title === undefined) {
      continue;
    }
    hymns.push({ number: Number(id), title: decodeDartString(title), lyric: decodeDartString(lyric) });
  }
  if (hymns.length === 0) {
    throw new ValidationError("No hymns were found in the Sacred Songs and Solos dataset.");
  }
  return hymns;
}
