import { MIN_RECOGNITION_CONFIDENCE } from "../../constants/app.constants.js";
import { tokenize } from "../../utils/text/text.helper.js";

/** A search hit before it is turned into a candidate. */
export interface ScorableHit<T> {
  readonly item: T;
  /** Raw search score from the repository. */
  readonly score: number;
  /** Text of the hit, used to measure how much of the transcript it covers. */
  readonly text: string;
}

export interface ScoredHit<T> extends ScorableHit<T> {
  readonly confidence: number;
  readonly coverage: number;
}

export interface ScorerOptions {
  /** Raw score that counts as a certain match for this kind of item. */
  readonly expectedMaxScore: number;
  readonly minConfidence?: number;
}

const MIN_TOKEN_LENGTH = 3;

function significantTokens(text: string): readonly string[] {
  const tokens = tokenize(text);
  const significant = tokens.filter((token) => token.length >= MIN_TOKEN_LENGTH);
  return significant.length > 0 ? significant : tokens;
}

/** Fraction of the transcript's words that appear in the candidate text. */
export function coverageOf(transcript: string, candidateText: string): number {
  const wanted = significantTokens(transcript);
  if (wanted.length === 0) {
    return 0;
  }
  const available = new Set(tokenize(candidateText));
  const matched = wanted.filter((token) => available.has(token)).length;
  return matched / wanted.length;
}

/**
 * Turns raw search scores into 0-100 confidences.
 *
 * Half of the confidence comes from the search score relative to what an
 * exact match produces, half from how much of the transcript the candidate
 * actually contains. Candidates behind the leader are scaled down by their
 * distance from it, so a clear winner reads as one.
 */
export function scoreHits<T>(transcript: string, hits: readonly ScorableHit<T>[], options: ScorerOptions): readonly ScoredHit<T>[] {
  const minConfidence = options.minConfidence ?? MIN_RECOGNITION_CONFIDENCE;
  const topScore = Math.max(...hits.map((hit) => hit.score), 0);
  return hits
    .map((hit) => {
      const coverage = coverageOf(transcript, hit.text);
      const relativeScore = Math.min(1, hit.score / options.expectedMaxScore);
      const base = 0.5 * relativeScore + 0.5 * coverage;
      const distance = topScore > 0 ? hit.score / topScore : 0;
      const confidence = Math.round(100 * base * Math.sqrt(distance));
      return { ...hit, coverage, confidence: Math.max(0, Math.min(100, confidence)) };
    })
    .filter((hit) => hit.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence || b.score - a.score);
}
