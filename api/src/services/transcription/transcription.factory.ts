import type { TranscriptionConfig } from "../../configs/index.js";
import type { TranscriptionProvider } from "../../interfaces/index.js";
import { FakeTranscriptionProvider } from "./fake.provider.js";
import { UnavailableTranscriptionProvider } from "./unavailable.provider.js";
import { WhisperTranscriptionProvider } from "./whisper.provider.js";

/** Builds the configured provider. */
export function createTranscriptionProvider(config: TranscriptionConfig): TranscriptionProvider {
  switch (config.provider) {
    case "whisper":
      return new WhisperTranscriptionProvider({ baseUrl: config.whisperUrl, timeoutMs: config.whisperTimeoutMs });
    case "fake":
      return new FakeTranscriptionProvider();
    case "none":
      return new UnavailableTranscriptionProvider();
  }
}
