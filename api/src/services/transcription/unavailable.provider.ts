import { ServiceUnavailableError } from "@zudojs/errors";
import type { TranscriptionProvider, TranscriptionResult } from "../../interfaces/index.js";

/** Stands in when no speech-to-text provider is configured; text recognition still works. */
export class UnavailableTranscriptionProvider implements TranscriptionProvider {
  public readonly name = "none";

  public async transcribe(): Promise<TranscriptionResult> {
    throw new ServiceUnavailableError("Audio recognition is not available: no transcription provider is configured.");
  }
}
