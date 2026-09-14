export interface VerseModel {
  readonly id: number;
  readonly translationId: string;
  readonly bookId: number;
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
}

/** A verse matched by search, with its ranking signals. */
export interface VerseSearchHit extends VerseModel {
  /** Combined score used for ordering; higher is better. */
  readonly score: number;
  /** Full-text rank from ts_rank_cd. */
  readonly rank: number;
  /** Trigram word similarity between the query and the verse. */
  readonly similarity: number;
}
