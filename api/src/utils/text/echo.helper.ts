/**
 * Finds where a hymn quotes scripture.
 *
 * Hymn writers of the period wrote with the King James Version open beside
 * them, and phrases of it run through their lines. Two texts sharing four
 * words in a row is weak evidence on its own ("and it came to pass"), so a
 * match is scored by how rare its shared words are in the Bible: "the print
 * of the nails" scores high, "O Lord our God" does not.
 */

export interface EchoVerse {
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  /** Normalized words, as `normalizeText` produces them. */
  readonly words: readonly string[];
}

export interface EchoHymn {
  readonly hymnId: string;
  readonly words: readonly string[];
}

export interface ScriptureEcho {
  readonly hymnId: string;
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  /** The longest run of words the two share. */
  readonly phrase: string;
  readonly score: number;
}

export interface EchoOptions {
  /** Words in a row that must match. */
  readonly run: number;
  /** A run found in more verses than this is a formula of the language, not a quotation. */
  readonly maxVersesPerRun: number;
  /** Least summed rarity of the shared words. */
  readonly minScore: number;
  readonly perHymn: number;
}

export const DEFAULT_ECHO_OPTIONS: EchoOptions = Object.freeze({ run: 4, maxVersesPerRun: 12, minScore: 16, perHymn: 4 });

const SEPARATOR = " ";

export function findScriptureEchoes(verses: readonly EchoVerse[], hymns: readonly EchoHymn[], options: EchoOptions = DEFAULT_ECHO_OPTIONS): readonly ScriptureEcho[] {
  const documentFrequency = new Map<string, number>();
  const runs = new Map<string, number[]>();
  verses.forEach((verse, at) => {
    for (const word of new Set(verse.words)) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    const seen = new Set<string>();
    for (let start = 0; start + options.run <= verse.words.length; start += 1) {
      const key = verse.words.slice(start, start + options.run).join(SEPARATOR);
      if (seen.has(key)) continue;
      seen.add(key);
      const list = runs.get(key);
      if (list === undefined) runs.set(key, [at]);
      else list.push(at);
    }
  });
  const rarity = (word: string): number => Math.log((verses.length + 1) / ((documentFrequency.get(word) ?? 0) + 1));

  const echoes: ScriptureEcho[] = [];
  for (const hymn of hymns) {
    /** Verse index -> positions in the hymn that fall inside a shared run. */
    const shared = new Map<number, Set<number>>();
    for (let start = 0; start + options.run <= hymn.words.length; start += 1) {
      const found = runs.get(hymn.words.slice(start, start + options.run).join(SEPARATOR));
      if (found === undefined || found.length > options.maxVersesPerRun) continue;
      for (const at of found) {
        const positions = shared.get(at) ?? new Set<number>();
        for (let offset = 0; offset < options.run; offset += 1) positions.add(start + offset);
        shared.set(at, positions);
      }
    }
    const scored: ScriptureEcho[] = [];
    for (const [at, positions] of shared) {
      const verse = verses[at];
      if (verse === undefined) continue;
      const score = [...new Set([...positions].map((position) => hymn.words[position] ?? ""))].reduce((sum, word) => sum + rarity(word), 0);
      if (score < options.minScore) continue;
      scored.push({ hymnId: hymn.hymnId, bookId: verse.bookId, chapter: verse.chapter, verse: verse.verse, phrase: longestRun(hymn.words, positions), score: Math.round(score * 10) / 10 });
    }
    scored.sort((a, b) => b.score - a.score || a.bookId - b.bookId || a.chapter - b.chapter || a.verse - b.verse);
    echoes.push(...scored.slice(0, options.perHymn));
  }
  return echoes;
}

function longestRun(words: readonly string[], positions: ReadonlySet<number>): string {
  const sorted = [...positions].sort((a, b) => a - b);
  let best: number[] = [];
  let current: number[] = [];
  for (const position of sorted) {
    if (current.length > 0 && position !== (current.at(-1) ?? -2) + 1) current = [];
    current.push(position);
    if (current.length > best.length) best = [...current];
  }
  return best.map((position) => words[position] ?? "").join(" ");
}
