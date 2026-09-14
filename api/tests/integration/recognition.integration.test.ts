import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Runtime } from "@zudojs/runtime";
import { createApp } from "../../src/app.js";
import { TOKENS } from "../../src/constants/index.js";
import { parseKjvDataset } from "../../src/jobs/importBible/index.js";
import { ImportTranslationCommand } from "../../src/modules/bible/commands/index.js";
import { ImportHymnalCommand } from "../../src/modules/hymns/commands/index.js";
import { createHymnalFixture } from "../fixtures/hymns.fixture.js";
import { createKjvFixture } from "../fixtures/kjv.fixture.js";
import { TEST_ENV } from "../helpers/testApp.helper.js";

const databaseUrl = process.env["TEST_DATABASE_URL"];

interface Result {
  attemptId: string;
  transcript: string;
  inputType: string;
  best: { type: string; confidence: number; reference?: string; slug?: string } | null;
  candidates: { type: string }[];
  transcription: { provider: string } | null;
}

async function boot(provider: "fake" | "none"): Promise<{ runtime: Runtime; baseUrl: string }> {
  const runtime = await createApp({ env: { ...TEST_ENV, DATABASE_URL: databaseUrl, TRANSCRIPTION_PROVIDER: provider } });
  await runtime.start();
  return { runtime, baseUrl: `http://127.0.0.1:${runtime.context.container.resolve(TOKENS.httpServer).address?.port}` };
}

describe.skipIf(databaseUrl === undefined)("recognition integration", () => {
  let app: { runtime: Runtime; baseUrl: string };

  beforeAll(async () => {
    app = await boot("fake");
    const commandBus = app.runtime.context.container.resolve(TOKENS.commandBus);
    await commandBus.execute(new ImportTranslationCommand({
      translation: { code: "KJV", name: "King James Version", language: "en", rightsStatus: "public-domain", sourceName: "fixture", isDefault: true },
      books: parseKjvDataset(createKjvFixture()),
    }));
    await commandBus.execute(new ImportHymnalCommand(createHymnalFixture()));
  });

  afterAll(async () => {
    await app?.runtime.stop();
  });

  it("identifies a verse from text and records the attempt", async () => {
    const response = await fetch(`${app.baseUrl}/recognize/text`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "for God so loved the world that he gave his only begotten son", mode: "bible" }),
    });
    expect(response.status).toBe(200);
    const result = (await response.json()) as Result;
    expect(result.best?.type).toBe("verse");
    expect(result.best?.reference).toBe("John 3:16");
    expect(result.best?.confidence).toBeGreaterThanOrEqual(80);
    expect(result.transcription).toBeNull();
    const stored = (await (await fetch(`${app.baseUrl}/recognize/attempts/${result.attemptId}`)).json()) as Result;
    expect(stored.best?.reference).toBe("John 3:16");
    expect(stored.inputType).toBe("TEXT");
  });

  it("identifies a hymn from a recording through the fake provider", async () => {
    const form = new FormData();
    form.set("audio", new Blob([new TextEncoder().encode("amazing grace how sweet the sound that saved a wretch like me")], { type: "audio/webm" }), "clip.webm");
    form.set("mode", "hymn");
    const response = await fetch(`${app.baseUrl}/recognize/audio`, { method: "POST", body: form });
    expect(response.status).toBe(200);
    const result = (await response.json()) as Result;
    expect(result.inputType).toBe("AUDIO");
    expect(result.transcription?.provider).toBe("fake");
    expect(result.best?.type).toBe("hymn");
    expect(result.best?.slug).toBe("amazing-grace");
  });

  it("picks between verse and hymn in auto mode", async () => {
    const response = await fetch(`${app.baseUrl}/recognize/text`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "abide with me fast falls the eventide" }),
    });
    const result = (await response.json()) as Result;
    expect(result.best?.type).toBe("hymn");
    expect(result.best?.slug).toBe("abide-with-me");
  });

  it("rejects bad input", async () => {
    expect((await fetch(`${app.baseUrl}/recognize/text`, { method: "POST", headers: { "content-type": "application/json" }, body: "{" })).status).toBe(400);
    expect((await fetch(`${app.baseUrl}/recognize/text`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "a" }) })).status).toBe(400);
    const form = new FormData();
    form.set("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "text/plain" }), "clip.txt");
    expect((await fetch(`${app.baseUrl}/recognize/audio`, { method: "POST", body: form })).status).toBe(400);
    expect((await fetch(`${app.baseUrl}/recognize/attempts/not-a-uuid`)).status).toBe(400);
    expect((await fetch(`${app.baseUrl}/recognize/attempts/00000000-0000-4000-8000-000000000000`)).status).toBe(404);
  });

  it("searches verses and hymns at once", async () => {
    const result = (await (await fetch(`${app.baseUrl}/search?q=${encodeURIComponent("god so loved the world")}`)).json()) as { verses: { results: { reference: string }[] }; hymns: { results: unknown[] } };
    expect(result.verses.results[0]?.reference).toBe("John 3:16");
    expect(Array.isArray(result.hymns.results)).toBe(true);
    const hymnsOnly = (await (await fetch(`${app.baseUrl}/search?q=amazing+grace&type=hymns`)).json()) as { verses: null; hymns: { results: { slug: string; excerpt?: string }[] } };
    expect(hymnsOnly.verses).toBeNull();
    expect(hymnsOnly.hymns.results[0]?.slug).toBe("amazing-grace");
    expect(hymnsOnly.hymns.results[0]?.excerpt).toBeUndefined();
  });

  it("answers 503 for audio when no provider is configured, while text still works", async () => {
    const other = await boot("none");
    try {
      const form = new FormData();
      form.set("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "clip.webm");
      expect((await fetch(`${other.baseUrl}/recognize/audio`, { method: "POST", body: form })).status).toBe(503);
      const text = await fetch(`${other.baseUrl}/recognize/text`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "in the beginning god created the heaven and the earth" }) });
      expect(text.status).toBe(200);
    } finally {
      await other.runtime.stop();
    }
  });
});
