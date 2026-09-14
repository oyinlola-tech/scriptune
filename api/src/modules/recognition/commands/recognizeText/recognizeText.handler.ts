import { CommandHandler } from "@zudojs/cqrs";
import { toRecognitionResultDto, type RecognitionResultDto } from "../../../../dtos/index.js";
import type { TranscriptionResult } from "../../../../interfaces/index.js";
import { candidateKey, type RecognitionInputName } from "../../../../models/index.js";
import type { RecognitionAttemptRepository } from "../../../../repositories/index.js";
import type { RecognitionEngine } from "../../../../services/recognition/index.js";
import { normalizeText } from "../../../../utils/text/text.helper.js";
import { RECOGNIZE_TEXT, type RecognizeTextCommand, type RecognizeTextInput } from "./recognizeText.command.js";

export interface AudioDetails {
  readonly transcription: TranscriptionResult;
  readonly mimeType: string;
  readonly bytes: number;
}

/**
 * Runs the search side of recognition and records the attempt. The audio
 * handler delegates here once it has a transcript.
 */
export class RecognizeTextHandler extends CommandHandler<RecognizeTextCommand, RecognitionResultDto> {
  public readonly commandType = RECOGNIZE_TEXT;

  private readonly engine: RecognitionEngine;
  private readonly attempts: RecognitionAttemptRepository;

  public constructor(engine: RecognitionEngine, attempts: RecognitionAttemptRepository) {
    super();
    this.engine = engine;
    this.attempts = attempts;
  }

  public async execute(command: RecognizeTextCommand): Promise<RecognitionResultDto> {
    return this.recognize(command.input, "TEXT", performance.now());
  }

  public async recognize(input: RecognizeTextInput, inputType: RecognitionInputName, startedAt: number, audio?: AudioDetails): Promise<RecognitionResultDto> {
    const candidates = await this.engine.findCandidates({ text: input.text, mode: input.mode, language: input.language });
    const best = candidates[0];
    const attempt = await this.attempts.create({
      mode: input.mode,
      inputType,
      language: input.detectedLanguage ?? input.language,
      transcript: input.text,
      normalizedText: normalizeText(input.text),
      provider: audio?.transcription.provider ?? null,
      providerConfidence: audio?.transcription.confidence ?? null,
      providerLatencyMs: audio?.transcription.latencyMs ?? null,
      audioMimeType: audio?.mimeType ?? null,
      audioBytes: audio?.bytes ?? null,
      candidates,
      topResultType: best?.type ?? null,
      topResultKey: best === undefined ? null : candidateKey(best),
      confidence: best?.confidence ?? null,
      totalDurationMs: Math.round(performance.now() - startedAt),
      userId: input.userId ?? null,
    });
    return toRecognitionResultDto(attempt);
  }
}
