import type { QueryBus } from "@zudojs/cqrs";
import { RECOGNITION_CANDIDATE_LIMIT } from "../../constants/app.constants.js";
import type { VerseSearchResultDto } from "../../dtos/index.js";
import type { HymnCandidate, RecognitionCandidate, RecognitionModeName, VerseCandidate } from "../../models/index.js";
import { SearchVersesQuery } from "../../modules/bible/queries/index.js";
import { SearchHymnsQuery, type HymnSearchResultDto } from "../../modules/hymns/queries/index.js";
import { scoreHits } from "./confidence.scorer.js";

export interface RecognitionEngineOptions {
  readonly queryBus: QueryBus;
  readonly defaultTranslation: string;
  readonly candidateLimit?: number;
}

export interface RecognitionRequest {
  readonly text: string;
  readonly mode: RecognitionModeName;
  /** ISO 639 code, or "auto" to search hymn texts in every language. */
  readonly language: string;
}

export const AUTO_LANGUAGE = "auto";

/** Raw search score an exact verse or hymn match produces, from corpus measurements. */
const VERSE_EXPECTED_MAX = 0.42;
const HYMN_EXPECTED_MAX = 0.6;
const SEARCH_LIMIT = 10;

/**
 * Finds what a transcript most likely is: a verse, a hymn, or either.
 * Searches run through the query bus so the engine owns no data access.
 */
export class RecognitionEngine {
  private readonly queryBus: QueryBus;
  private readonly defaultTranslation: string;
  private readonly candidateLimit: number;

  public constructor(options: RecognitionEngineOptions) {
    this.queryBus = options.queryBus;
    this.defaultTranslation = options.defaultTranslation;
    this.candidateLimit = options.candidateLimit ?? RECOGNITION_CANDIDATE_LIMIT;
  }

  public async findCandidates(request: RecognitionRequest): Promise<readonly RecognitionCandidate[]> {
    const wantVerses = request.mode !== "HYMN";
    const wantHymns = request.mode !== "BIBLE";
    const [verses, hymns] = await Promise.all([
      wantVerses ? this.verseCandidates(request.text) : Promise.resolve([]),
      wantHymns ? this.hymnCandidates(request.text, request.language) : Promise.resolve([]),
    ]);
    return [...verses, ...hymns]
      .sort((a, b) => b.confidence - a.confidence || b.score - a.score)
      .slice(0, this.candidateLimit);
  }

  private async verseCandidates(text: string): Promise<readonly VerseCandidate[]> {
    const result = await this.queryBus.execute<SearchVersesQuery, VerseSearchResultDto>(
      new SearchVersesQuery(null, text, SEARCH_LIMIT),
    );
    const scored = scoreHits(
      text,
      result.results.map((hit) => ({ item: hit, score: hit.score, text: hit.text })),
      { expectedMaxScore: VERSE_EXPECTED_MAX },
    );
    return scored.map(({ item, confidence, score }) => ({
      type: "verse",
      confidence,
      score,
      translation: item.translation,
      reference: item.reference,
      book: item.book.slug,
      chapter: item.chapter,
      verse: item.verse,
      text: item.text,
    }));
  }

  private async hymnCandidates(text: string, language: string): Promise<readonly HymnCandidate[]> {
    const result = await this.queryBus.execute<SearchHymnsQuery, HymnSearchResultDto>(
      new SearchHymnsQuery(text, SEARCH_LIMIT, language === AUTO_LANGUAGE ? undefined : language),
    );
    const scored = scoreHits(
      text,
      result.results.map((hit) => ({ item: hit, score: hit.score, text: `${hit.title} ${hit.firstLine} ${hit.excerpt ?? ""}` })),
      { expectedMaxScore: HYMN_EXPECTED_MAX },
    );
    return scored.map(({ item, confidence, score }) => ({
      type: "hymn",
      confidence,
      score,
      slug: item.slug,
      title: item.title,
      firstLine: item.firstLine,
      language: item.language,
    }));
  }
}
