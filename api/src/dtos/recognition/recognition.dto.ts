import type { RecognitionAttemptModel, RecognitionCandidate, RecognitionInputName, RecognitionModeName } from "../../models/index.js";

export interface TranscriptionSummaryDto {
  readonly provider: string;
  readonly confidence: number | null;
  readonly latencyMs: number | null;
}

/** What the client gets back from an identification. */
export interface RecognitionResultDto {
  readonly attemptId: string;
  readonly mode: RecognitionModeName;
  readonly inputType: RecognitionInputName;
  readonly transcript: string;
  readonly transcription: TranscriptionSummaryDto | null;
  readonly candidates: readonly RecognitionCandidate[];
  readonly best: RecognitionCandidate | null;
  readonly durationMs: number;
  readonly createdAt: string;
}

export function toRecognitionResultDto(attempt: RecognitionAttemptModel): RecognitionResultDto {
  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    inputType: attempt.inputType,
    transcript: attempt.transcript,
    transcription:
      attempt.provider === null
        ? null
        : { provider: attempt.provider, confidence: attempt.providerConfidence, latencyMs: attempt.providerLatencyMs },
    candidates: attempt.candidates,
    best: attempt.candidates[0] ?? null,
    durationMs: attempt.totalDurationMs,
    createdAt: attempt.createdAt.toISOString(),
  };
}
