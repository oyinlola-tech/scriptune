import type { TranscriptionInput, TranscriptionProvider, TranscriptionResult } from "../../interfaces/index.js";

/**
 * Treats the uploaded bytes as UTF-8 text and returns them as the transcript.
 * Lets the whole recognition pipeline run in tests and local development
 * without a speech-to-text account. Never enabled by default.
 */
export class FakeTranscriptionProvider implements TranscriptionProvider {
  public readonly name = "fake";

  public async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    return {
      provider: this.name,
      transcript: new TextDecoder("utf-8", { fatal: false }).decode(input.audio).trim(),
      confidence: 1,
      words: [],
      latencyMs: 0,
    };
  }
}
