export type RecognitionModeName = "BIBLE" | "HYMN" | "AUTO";
export type RecognitionInputName = "AUDIO" | "TEXT";
export type CandidateType = "verse" | "hymn";

/** A verse the recognizer considers a match. */
export interface VerseCandidate {
  readonly type: "verse";
  readonly confidence: number;
  readonly score: number;
  readonly translation: string;
  readonly reference: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
}

/** A hymn the recognizer considers a match. */
export interface HymnCandidate {
  readonly type: "hymn";
  readonly confidence: number;
  readonly score: number;
  readonly slug: string;
  readonly title: string;
  readonly firstLine: string;
  readonly language: string;
}

export type RecognitionCandidate = VerseCandidate | HymnCandidate;

export interface RecognitionAttemptModel {
  readonly id: string;
  readonly mode: RecognitionModeName;
  readonly inputType: RecognitionInputName;
  readonly language: string;
  readonly transcript: string;
  readonly normalizedText: string;
  readonly provider: string | null;
  readonly providerConfidence: number | null;
  readonly providerLatencyMs: number | null;
  readonly audioMimeType: string | null;
  readonly audioBytes: number | null;
  readonly candidates: readonly RecognitionCandidate[];
  readonly topResultType: CandidateType | null;
  readonly topResultKey: string | null;
  readonly confidence: number | null;
  readonly totalDurationMs: number;
  readonly userId: string | null;
  readonly createdAt: Date;
}

/** Key that identifies a candidate across attempts, e.g. "KJV:john:3:16" or a hymn slug. */
export function candidateKey(candidate: RecognitionCandidate): string {
  return candidate.type === "verse"
    ? `${candidate.translation}:${candidate.book}:${candidate.chapter}:${candidate.verse}`
    : candidate.slug;
}
