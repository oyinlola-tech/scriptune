export type StanzaKind = "verse" | "chorus";

/** One block of a hymn's words. Choruses repeat after each verse. */
export interface Stanza {
  readonly number: number | null;
  readonly kind: StanzaKind;
  readonly lines: readonly string[];
}

export interface HymnTextModel {
  readonly id: string;
  readonly hymnId: string;
  readonly language: string;
  readonly variant: string;
  readonly title: string;
  readonly stanzas: readonly Stanza[];
  readonly lyrics: string;
  readonly firstLine: string;
  readonly rightsStatus: string;
  readonly sourceId: string | null;
}

/** A hymn text matched by search, with its ranking signals. */
export interface HymnSearchHit {
  readonly hymnId: string;
  readonly textId: string;
  readonly slug: string;
  readonly title: string;
  readonly language: string;
  readonly firstLine: string;
  /** Normalized lyrics, used by the recognizer to measure transcript coverage. */
  readonly normalizedLyrics: string;
  readonly score: number;
  readonly rank: number;
  readonly similarity: number;
  readonly firstLineSimilarity: number;
}

function isStanza(value: unknown): value is Stanza {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { number?: unknown; kind?: unknown; lines?: unknown };
  return (
    (candidate.number === null || typeof candidate.number === "number") &&
    (candidate.kind === "verse" || candidate.kind === "chorus") &&
    Array.isArray(candidate.lines) &&
    candidate.lines.every((line) => typeof line === "string")
  );
}

/** Narrows the JSON column to stanzas, dropping anything malformed. */
export function toStanzas(value: unknown): readonly Stanza[] {
  return Array.isArray(value) ? value.filter(isStanza) : [];
}
