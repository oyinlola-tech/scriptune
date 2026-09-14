export interface TranscriptionInput {
  readonly audio: Uint8Array;
  readonly mimeType: string;
  /** BCP-47 language such as "en" or "yo". Omit to let the provider detect it. */
  readonly language?: string;
  /** Terms the provider should favour, such as hymn vocabulary. */
  readonly hints?: readonly string[];
}

export interface TranscribedWord {
  readonly word: string;
  readonly start: number;
  readonly end: number;
  readonly confidence: number;
}

export interface TranscriptionResult {
  readonly provider: string;
  readonly model?: string;
  readonly transcript: string;
  /** Language the provider heard (ISO 639-1 such as "yo"), when it detects one. */
  readonly language?: string;
  /** Provider's own confidence, 0 to 1, when reported. */
  readonly confidence?: number;
  readonly words?: readonly TranscribedWord[];
  readonly latencyMs: number;
}

/**
 * Turns audio into text. Implementations wrap one vendor so the recognition
 * pipeline never depends on a specific speech-to-text service.
 */
export interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput, signal?: AbortSignal): Promise<TranscriptionResult>;
}
