import type { ConfigManager } from "@zudojs/config";
import { toInteger, toOneOf, toRequiredString } from "./config.parser.js";

export type TranscriptionProviderName = "whisper" | "fake" | "none";

export interface TranscriptionConfig {
  readonly provider: TranscriptionProviderName;
  /** Base URL of the local Whisper transcriber service (transcriber/). */
  readonly whisperUrl: string;
  readonly whisperTimeoutMs: number;
}

export interface RecognitionConfig {
  /** Requests per minute per client IP on the recognition endpoints. */
  readonly rateLimitMax: number;
  readonly defaultTranslation: string;
}

const PROVIDERS: readonly TranscriptionProviderName[] = ["whisper", "fake", "none"];

/**
 * Picks the transcription provider. Whisper (the local transcriber service)
 * is the default; the fake provider must be asked for explicitly so a
 * misconfigured production box can never silently echo audio bytes as words.
 */
export function readTranscriptionConfig(manager: ConfigManager): TranscriptionConfig {
  const requested = manager.get("transcription_provider");
  const provider = requested === undefined ? "whisper" : toOneOf("TRANSCRIPTION_PROVIDER", requested, PROVIDERS);
  const whisperUrl = toRequiredString("WHISPER_URL", manager.get("whisper_url")).replace(/\/$/, "");
  try {
    new URL(whisperUrl);
  } catch {
    throw toOneOf("WHISPER_URL", whisperUrl, ["an http(s) URL such as http://localhost:5005"]);
  }
  return Object.freeze({
    provider,
    whisperUrl,
    whisperTimeoutMs: toInteger("WHISPER_TIMEOUT_MS", manager.get("whisper_timeout_ms"), { min: 1000 }),
  });
}

export function readRecognitionConfig(manager: ConfigManager): RecognitionConfig {
  return Object.freeze({
    rateLimitMax: toInteger("RECOGNITION_RATE_LIMIT_MAX", manager.get("recognition_rate_limit_max"), { min: 1 }),
    defaultTranslation: toRequiredString("DEFAULT_TRANSLATION", manager.get("default_translation")).toUpperCase(),
  });
}
