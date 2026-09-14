import { ExternalServiceError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { FakeTranscriptionProvider, WhisperTranscriptionProvider } from "../../src/services/transcription/index.js";

function fakeFetch(handler: (input: Request) => Response): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => handler(new Request(input, init))) as typeof fetch;
}

describe("WhisperTranscriptionProvider", () => {
  it("posts the audio to the local service and maps the transcript", async () => {
    let seen: Request | undefined;
    const provider = new WhisperTranscriptionProvider({
      baseUrl: "http://localhost:5005",
      fetch: fakeFetch((request) => {
        seen = request;
        return Response.json({ model: "base", transcript: " For God so loved the world ", confidence: 0.91, words: [{ word: "For", start: 0, end: 0.2, confidence: 0.9 }] });
      }),
    });
    const result = await provider.transcribe({ audio: new Uint8Array([1, 2, 3]), mimeType: "audio/webm", language: "en", hints: ["Amazing Grace", "hymn"] });
    expect(result.provider).toBe("whisper");
    expect(result.model).toBe("base");
    expect(result.transcript).toBe("For God so loved the world");
    expect(result.confidence).toBe(0.91);
    expect(result.words?.[0]?.word).toBe("For");
    expect(seen?.method).toBe("POST");
    expect(seen?.headers.get("content-type")).toBe("audio/webm");
    const url = new URL(seen?.url ?? "");
    expect(url.pathname).toBe("/transcribe");
    expect(url.searchParams.get("language")).toBe("en");
    expect(url.searchParams.get("prompt")).toBe("Amazing Grace, hymn");
  });

  it("lets the service detect the language when none is given and reports what it heard", async () => {
    let seen: Request | undefined;
    const provider = new WhisperTranscriptionProvider({ baseUrl: "http://localhost:5005", fetch: fakeFetch((request) => { seen = request; return Response.json({ transcript: "Ọlọrun mi", language: "yo", words: [] }); }) });
    const result = await provider.transcribe({ audio: new Uint8Array([1]), mimeType: "audio/mp4" });
    expect(new URL(seen?.url ?? "").searchParams.has("language")).toBe(false);
    expect(result.language).toBe("yo");
  });

  it("leaves confidence out when the service reports none", async () => {
    const provider = new WhisperTranscriptionProvider({ baseUrl: "http://localhost:5005", fetch: fakeFetch(() => Response.json({ transcript: "hello", confidence: null, words: [] })) });
    const result = await provider.transcribe({ audio: new Uint8Array([1]), mimeType: "audio/mp4", language: "en" });
    expect(result.transcript).toBe("hello");
    expect(result.confidence).toBeUndefined();
  });

  it("wraps service failures", async () => {
    const rejecting = new WhisperTranscriptionProvider({ baseUrl: "http://localhost:5005", fetch: fakeFetch(() => new Response("nope", { status: 415 })) });
    await expect(rejecting.transcribe({ audio: new Uint8Array([1]), mimeType: "audio/webm", language: "en" })).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(rejecting.transcribe({ audio: new Uint8Array([1]), mimeType: "audio/webm", language: "en" })).rejects.toThrow(/415/);
    const unreachable = new WhisperTranscriptionProvider({ baseUrl: "http://localhost:5005", fetch: (async () => { throw new TypeError("fetch failed"); }) as typeof fetch });
    await expect(unreachable.transcribe({ audio: new Uint8Array([1]), mimeType: "audio/webm", language: "en" })).rejects.toThrow(/could not be reached/);
  });
});

describe("FakeTranscriptionProvider", () => {
  it("echoes the bytes as text", async () => {
    const result = await new FakeTranscriptionProvider().transcribe({ audio: new TextEncoder().encode("  hello there "), mimeType: "audio/webm", language: "en" });
    expect(result.transcript).toBe("hello there");
    expect(result.provider).toBe("fake");
  });
});
