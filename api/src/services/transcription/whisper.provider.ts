import { ExternalServiceError, GatewayTimeoutError } from "@zudojs/errors";
import type { TranscribedWord, TranscriptionInput, TranscriptionProvider, TranscriptionResult } from "../../interfaces/index.js";

export interface WhisperProviderOptions {
  /** Base URL of the local transcriber service (see transcriber/). */
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  /** Injectable for tests. */
  readonly fetch?: typeof fetch;
}

interface WhisperResponse {
  readonly model?: string;
  readonly transcript?: string;
  readonly language?: string | null;
  readonly confidence?: number | null;
  readonly words?: readonly { readonly word?: string; readonly start?: number; readonly end?: number; readonly confidence?: number }[];
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * OpenAI Whisper running in the local transcriber service. Audio goes to a
 * process on this machine (or a private network), never to a hosted vendor.
 */
export class WhisperTranscriptionProvider implements TranscriptionProvider {
  public readonly name = "whisper";

  private readonly options: Required<Omit<WhisperProviderOptions, "fetch">> & { readonly fetch: typeof fetch };

  public constructor(options: WhisperProviderOptions) {
    this.options = {
      baseUrl: options.baseUrl,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      fetch: options.fetch ?? globalThis.fetch,
    };
  }

  public async transcribe(input: TranscriptionInput, signal?: AbortSignal): Promise<TranscriptionResult> {
    const url = new URL("/transcribe", this.options.baseUrl);
    if (input.language !== undefined) {
      url.searchParams.set("language", input.language);
    }
    const hints = (input.hints ?? []).filter((hint) => hint.trim() !== "");
    if (hints.length > 0) {
      url.searchParams.set("prompt", hints.join(", "));
    }
    const startedAt = performance.now();
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    let response: Response;
    try {
      response = await this.options.fetch(url, {
        method: "POST",
        headers: { "content-type": input.mimeType },
        body: input.audio,
        signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
        throw new GatewayTimeoutError(`The transcriber did not answer within ${Math.round(this.options.timeoutMs / 1000)} seconds.`, { cause: error });
      }
      throw new ExternalServiceError("The transcriber service could not be reached. Is it running?", { service: "whisper", cause: error });
    }
    if (!response.ok) {
      throw new ExternalServiceError(`The transcriber rejected the audio (HTTP ${response.status}).`, {
        service: "whisper",
        metadata: { status: response.status },
      });
    }
    const payload = (await response.json()) as WhisperResponse;
    const words: TranscribedWord[] = (payload.words ?? []).map((word) => ({
      word: word.word ?? "",
      start: word.start ?? 0,
      end: word.end ?? 0,
      confidence: word.confidence ?? 0,
    }));
    return {
      provider: this.name,
      ...(payload.model === undefined ? {} : { model: payload.model }),
      transcript: payload.transcript?.trim() ?? "",
      ...(typeof payload.language === "string" && payload.language !== "" ? { language: payload.language } : {}),
      ...(typeof payload.confidence === "number" ? { confidence: payload.confidence } : {}),
      words,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
