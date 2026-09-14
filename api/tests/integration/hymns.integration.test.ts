import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Runtime } from "@zudojs/runtime";
import { createApp } from "../../src/app.js";
import { TOKENS } from "../../src/constants/index.js";
import { ImportHymnalCommand, type ImportHymnalResult } from "../../src/modules/hymns/commands/index.js";
import { createHymnalFixture } from "../fixtures/hymns.fixture.js";
import { TEST_ENV } from "../helpers/testApp.helper.js";

const databaseUrl = process.env["TEST_DATABASE_URL"];

describe.skipIf(databaseUrl === undefined)("hymns integration", () => {
  let runtime: Runtime;
  let baseUrl: string;

  beforeAll(async () => {
    runtime = await createApp({ env: { ...TEST_ENV, DATABASE_URL: databaseUrl } });
    await runtime.start();
    baseUrl = `http://127.0.0.1:${runtime.context.container.resolve(TOKENS.httpServer).address?.port}`;
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    const result = await commandBus.execute<ImportHymnalCommand, ImportHymnalResult>(new ImportHymnalCommand(createHymnalFixture()));
    expect(result.hymnCount).toBe(3);
    const again = await commandBus.execute<ImportHymnalCommand, ImportHymnalResult>(new ImportHymnalCommand(createHymnalFixture()));
    expect(again.hymnCount).toBe(3);
  });

  afterAll(async () => {
    await runtime?.stop();
  });

  it("lists hymnals and their entries", async () => {
    const hymnals = (await (await fetch(`${baseUrl}/hymnals`)).json()) as { hymnals: { slug: string; entryCount: number }[] };
    expect(hymnals.hymnals.find((hymnal) => hymnal.slug === "fixture-hymnal")?.entryCount).toBe(3);
    const hymnal = (await (await fetch(`${baseUrl}/hymnals/fixture-hymnal?limit=2`)).json()) as { entries: { items: { number: number; hymn: { slug: string } }[]; totalPages: number } };
    expect(hymnal.entries.items.map((entry) => entry.number)).toEqual([1, 2]);
    expect(hymnal.entries.totalPages).toBe(2);
    expect(hymnal.entries.items[0]?.hymn.slug).toBe("amazing-grace");
  });

  it("reads a hymn by slug and by hymnal number, with a disambiguated duplicate title", async () => {
    const hymn = (await (await fetch(`${baseUrl}/hymns/amazing-grace`)).json()) as { title: string; texts: { stanzas: unknown[]; firstLine: string }[]; placements: { number: number }[] };
    expect(hymn.title).toBe("Amazing Grace");
    expect(hymn.texts[0]?.stanzas).toHaveLength(2);
    expect(hymn.texts[0]?.firstLine).toBe("Amazing grace! how sweet the sound,");
    expect(hymn.placements[0]?.number).toBe(1);
    const byNumber = (await (await fetch(`${baseUrl}/hymnals/fixture-hymnal/3`)).json()) as { slug: string };
    expect(byNumber.slug).toBe("amazing-grace-3");
    expect((await fetch(`${baseUrl}/hymnals/fixture-hymnal/99`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/hymns/nope`)).status).toBe(404);
  });

  it("browses and searches hymns", async () => {
    const list = (await (await fetch(`${baseUrl}/hymns?hymnal=fixture-hymnal&limit=10`)).json()) as { items: { slug: string }[]; total: number };
    expect(list.total).toBe(3);
    expect(list.items[0]?.slug).toBe("abide-with-me");
    const search = (await (await fetch(`${baseUrl}/hymns/search?q=${encodeURIComponent("how sweet the sound that saved a wretch")}`)).json()) as { results: { slug: string; score: number }[] };
    expect(search.results[0]?.slug).toBe("amazing-grace");
    const firstLine = (await (await fetch(`${baseUrl}/hymns/search?q=${encodeURIComponent("abide with me fast falls the eventide")}`)).json()) as { results: { slug: string }[] };
    expect(firstLine.results[0]?.slug).toBe("abide-with-me");
  });

  it("answers the related-hymns route for a verse", async () => {
    const related = (await (await fetch(`${baseUrl}/bible/kjv/john/3/16/related`)).json()) as { reference: string; hymns: unknown[] };
    expect(related.reference).toBe("John 3:16");
    expect(related.hymns).toEqual([]);
    const topics = (await (await fetch(`${baseUrl}/topics`)).json()) as { topics: unknown[] };
    expect(topics.topics).toEqual([]);
  });

  it("exports a whole hymnal for offline clients", async () => {
    const response = await fetch(`${baseUrl}/export/hymnals/fixture-hymnal`);
    expect(response.status).toBe(200);
    const dump = (await response.json()) as { hymnal: { slug: string }; hymnCount: number; hymns: { number: number; slug: string; stanzas: { lines: string[] }[] }[] };
    expect(dump.hymnal.slug).toBe("fixture-hymnal");
    expect(dump.hymnCount).toBe(3);
    expect(dump.hymns[0]?.number).toBe(1);
    expect(dump.hymns[0]?.stanzas[0]?.lines[0]).toContain("Amazing grace");
    expect((await fetch(`${baseUrl}/export/hymnals/nope`)).status).toBe(404);
  });
});
