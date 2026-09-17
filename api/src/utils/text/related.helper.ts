/**
 * Pairs each hymn with the hymns most like it.
 *
 * The datasets carry words and nothing else: no tunes, topics or authors. So
 * likeness is measured on the words. Each hymn becomes a vector of its terms,
 * weighted up when a term is rare across the hymnal ("cleft", "Sabbath") and
 * left out when it is everywhere ("Lord", "love"); two hymns are alike by the
 * cosine between their vectors. Sharing a chapter of scripture counts as well.
 */

export interface RelatableHymn {
  readonly hymnId: string;
  readonly language: string;
  readonly words: readonly string[];
  /** Chapters of scripture the hymn is linked to, as "bookId:chapter". */
  readonly chapters: readonly string[];
}

export interface HymnRelationResult {
  readonly hymnId: string;
  readonly relatedHymnId: string;
  readonly score: number;
  readonly sharedChapter: string | null;
}

export interface RelateOptions {
  readonly perHymn: number;
  readonly minScore: number;
  /** A term in more than this share of the hymns says nothing about any one of them. */
  readonly maxDocumentShare: number;
  /** Added when two hymns draw on the same chapter. */
  readonly sharedChapterBonus: number;
}

export const DEFAULT_RELATE_OPTIONS: RelateOptions = Object.freeze({ perHymn: 6, minScore: 0.14, maxDocumentShare: 0.5, sharedChapterBonus: 0.1 });

export function relateHymns(hymns: readonly RelatableHymn[], options: RelateOptions = DEFAULT_RELATE_OPTIONS): readonly HymnRelationResult[] {
  const results: HymnRelationResult[] = [];
  const languages = new Set(hymns.map((hymn) => hymn.language));
  for (const language of languages) {
    const group = hymns.filter((hymn) => hymn.language === language);
    const documentFrequency = new Map<string, number>();
    for (const hymn of group) for (const word of new Set(hymn.words)) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);

    const vectors = group.map((hymn) => {
      const counts = new Map<string, number>();
      for (const word of hymn.words) counts.set(word, (counts.get(word) ?? 0) + 1);
      const vector = new Map<string, number>();
      for (const [word, count] of counts) {
        const seenIn = documentFrequency.get(word) ?? 0;
        if (word.length < 3 || seenIn > group.length * options.maxDocumentShare) continue;
        vector.set(word, (1 + Math.log(count)) * Math.log((group.length + 1) / (seenIn + 1)));
      }
      const length = Math.sqrt([...vector.values()].reduce((sum, weight) => sum + weight * weight, 0)) || 1;
      for (const [word, weight] of vector) vector.set(word, weight / length);
      return vector;
    });

    const postings = new Map<string, [number, number][]>();
    vectors.forEach((vector, at) => {
      for (const [word, weight] of vector) {
        const list = postings.get(word);
        if (list === undefined) postings.set(word, [[at, weight]]);
        else list.push([at, weight]);
      }
    });

    group.forEach((hymn, at) => {
      const scores = new Map<number, number>();
      for (const [word, weight] of vectors[at] ?? []) {
        for (const [other, otherWeight] of postings.get(word) ?? []) {
          if (other !== at) scores.set(other, (scores.get(other) ?? 0) + weight * otherWeight);
        }
      }
      const chapters = new Set(hymn.chapters);
      const ranked: HymnRelationResult[] = [];
      for (const [other, cosine] of scores) {
        const candidate = group[other];
        if (candidate === undefined || candidate.hymnId === hymn.hymnId) continue;
        const sharedChapter = candidate.chapters.find((chapter) => chapters.has(chapter)) ?? null;
        const score = Math.min(1, cosine + (sharedChapter === null ? 0 : options.sharedChapterBonus));
        if (score >= options.minScore) ranked.push({ hymnId: hymn.hymnId, relatedHymnId: candidate.hymnId, score: Math.round(score * 1000) / 1000, sharedChapter });
      }
      ranked.sort((a, b) => b.score - a.score || a.relatedHymnId.localeCompare(b.relatedHymnId));
      const seen = new Set<string>();
      for (const relation of ranked) {
        if (seen.has(relation.relatedHymnId)) continue;
        seen.add(relation.relatedHymnId);
        results.push(relation);
        if (seen.size === options.perHymn) break;
      }
    });
  }
  return results;
}

/**
 * True for a "title" that is really a line of tonic sol-fa ("s:s:l:s:fe:s:s"),
 * which one hymnal's source printed above the words.
 */
export function looksLikeSolfa(title: string): boolean {
  const notes = title.trim().split(/[\s:|,.\-]+/).filter((part) => part !== "");
  if (notes.length < 4) return false;
  const solfa = notes.filter((part) => /^(d|r|m|f|s|l|t|de|re|ri|me|fe|se|le|ta|ba|fa|so|la|te|do|mi)[',]?\d?$/i.test(part));
  return solfa.length / notes.length >= 0.8;
}
