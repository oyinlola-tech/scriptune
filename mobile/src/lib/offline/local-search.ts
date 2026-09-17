import type { HymnCandidate, HymnSearchHitDto, RecognitionResultDto, SearchAllResultDto, VerseCandidate, VerseSearchHitDto } from "@scriptune/contracts";
import { openDatabase } from "./database";

const MIN_CONFIDENCE = 10;

/** Lowercase with accents and tone marks removed, so "Olorun" and "Ọlọ́run" are the same word. */
function fold(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Lowercase words of two or more letters, deduplicated, ready for FTS. */
export function tokenize(text: string): string[] {
  const words = fold(text).replace(/[^\p{L}\p{N}\s']/gu, " ").split(/\s+/).map((word) => word.replace(/^'+|'+$/g, "")).filter((word) => word.length >= 2);
  return [...new Set(words)];
}

function matchExpression(tokens: string[]): string {
  return tokens.map((token) => `"${token.replace(/"/g, "")}"`).join(" OR ");
}

/** Share of query words that appear in the candidate text. */
function coverage(tokens: string[], text: string): number {
  if (tokens.length === 0) return 0;
  const haystack = ` ${fold(text).replace(/[^\p{L}\p{N}\s']/gu, " ")} `;
  const hits = tokens.filter((token) => haystack.includes(` ${token} `) || haystack.includes(` ${token}`)).length;
  return hits / tokens.length;
}

interface VerseHitRow { translation: string; book_ord: number; chapter: number; verse: number; text: string; rank: number; name: string; slug: string; abbreviation: string }
interface HymnHitRow { slug: string; title: string; first_line: string; language: string; lyrics: string; rank: number }

/** The translation local verse search reads, preferring KJV, then any downloaded Bible. */
async function preferredTranslation(): Promise<string | null> {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{ id: string }>("SELECT id FROM corpora WHERE kind = 'bible'");
  if (rows.length === 0) return null;
  return rows.find((row) => row.id === "KJV")?.id ?? rows[0]!.id;
}

async function verseHits(tokens: string[], limit: number, translation: string): Promise<VerseHitRow[]> {
  if (tokens.length === 0) return [];
  const db = await openDatabase();
  return db.getAllAsync<VerseHitRow>(
    `SELECT f.translation, f.book_ord, f.chapter, f.verse, f.text, bm25(verses_fts) AS rank, b.name, b.slug, b.abbreviation
     FROM verses_fts f JOIN books b ON b.translation = f.translation AND b.ord = f.book_ord
     WHERE f.translation = ? AND verses_fts MATCH ? ORDER BY rank LIMIT ?`,
    translation, matchExpression(tokens), limit,
  );
}

async function hymnHits(tokens: string[], limit: number): Promise<HymnHitRow[]> {
  if (tokens.length === 0) return [];
  const db = await openDatabase();
  return db.getAllAsync<HymnHitRow>(
    `SELECT f.slug, h.title, h.first_line, h.language, f.lyrics, min(bm25(hymns_fts, 2.0, 1.0)) AS rank
     FROM hymns_fts f JOIN hymns h ON h.slug = f.slug AND h.hymnal = f.hymnal
     WHERE hymns_fts MATCH ? GROUP BY f.slug ORDER BY rank LIMIT ?`,
    matchExpression(tokens), limit,
  );
}

/** Text search over whatever is on the device, in the API's response shape. */
export async function searchLocal(query: string, limit = 10): Promise<SearchAllResultDto> {
  const tokens = tokenize(query);
  const translation = await preferredTranslation();
  const [verses, hymns] = await Promise.all([translation === null ? Promise.resolve([]) : verseHits(tokens, limit, translation), hymnHits(tokens, limit)]);
  const verseResults: VerseSearchHitDto[] = verses.map((row) => ({
    reference: `${row.name} ${row.chapter}:${row.verse}`, translation: row.translation, book: { slug: row.slug, name: row.name, abbreviation: row.abbreviation }, chapter: row.chapter, verse: row.verse, text: row.text, score: -row.rank,
  }));
  const hymnResults: HymnSearchHitDto[] = hymns.map((row) => ({ slug: row.slug, title: row.title, firstLine: row.first_line, language: row.language, score: -row.rank }));
  return { query, verses: translation === null ? null : { translation, results: verseResults }, hymns: { results: hymnResults } };
}

/**
 * Identifies typed or transcribed words against the device copy. Confidence
 * follows the API's idea: how much of what was said is in the candidate,
 * scaled by how far behind the top match it sits.
 */
export async function recognizeLocal(transcript: string, mode: "bible" | "hymn" | "auto" = "auto"): Promise<RecognitionResultDto> {
  const started = Date.now();
  const tokens = tokenize(transcript);
  const translation = await preferredTranslation();
  const [verses, hymns] = await Promise.all([mode === "hymn" || translation === null ? [] : verseHits(tokens, 8, translation), mode === "bible" ? [] : hymnHits(tokens, 8)]);
  const scored: (VerseCandidate | HymnCandidate)[] = [
    ...verses.map((row): VerseCandidate => ({
      type: "verse", confidence: 0, score: -row.rank * coverage(tokens, row.text), translation: row.translation,
      reference: `${row.name} ${row.chapter}:${row.verse}`, book: row.slug, chapter: row.chapter, verse: row.verse, text: row.text,
    })),
    ...hymns.map((row): HymnCandidate => ({
      type: "hymn", confidence: 0, score: -row.rank * coverage(tokens, `${row.title} ${row.lyrics}`), slug: row.slug, title: row.title, firstLine: row.first_line, language: row.language,
    })),
  ].sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  const candidates = scored
    .map((candidate) => {
      const text = candidate.type === "verse" ? candidate.text : `${candidate.title} ${candidate.firstLine}`;
      const cover = coverage(tokens, candidate.type === "verse" ? text : text + " " + (hymns.find((row) => row.slug === candidate.slug)?.lyrics ?? ""));
      const relative = top > 0 ? Math.sqrt(candidate.score / top) : 0;
      return { ...candidate, confidence: Math.round(100 * cover * relative) };
    })
    .filter((candidate) => candidate.confidence >= MIN_CONFIDENCE)
    .slice(0, 5);
  return {
    attemptId: `local-${started.toString(36)}`,
    mode: mode.toUpperCase() as RecognitionResultDto["mode"],
    inputType: "TEXT",
    transcript,
    transcription: null,
    candidates,
    best: candidates[0] ?? null,
    durationMs: Date.now() - started,
    createdAt: new Date(started).toISOString(),
  };
}
