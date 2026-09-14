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

describe.skipIf(databaseUrl === undefined)("library integration", () => {
  let runtime: Runtime;
  let baseUrl: string;
  let token: string;

  const call = (method: string, path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

  beforeAll(async () => {
    runtime = await createApp({ env: { ...TEST_ENV, DATABASE_URL: databaseUrl } });
    await runtime.start();
    baseUrl = `http://127.0.0.1:${runtime.context.container.resolve(TOKENS.httpServer).address?.port}`;
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    await commandBus.execute(new ImportTranslationCommand({
      translation: { code: "KJV", name: "King James Version", language: "en", rightsStatus: "public-domain", sourceName: "fixture", isDefault: true },
      books: parseKjvDataset(createKjvFixture()),
    }));
    await commandBus.execute(new ImportHymnalCommand(createHymnalFixture()));
    const register = await fetch(`${baseUrl}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `lib-${Date.now()}@example.com`, password: "correct horse battery" }) });
    token = ((await register.json()) as { tokens: { accessToken: string } }).tokens.accessToken;
  });

  afterAll(async () => {
    await runtime?.stop();
  });

  it("saves, lists and removes hymns and verses", async () => {
    expect((await call("POST", "/library/saved", { type: "hymn", key: "amazing-grace" })).status).toBe(201);
    const verse = await call("POST", "/library/saved", { type: "verse", key: "kjv:John:3:16" });
    expect(verse.status).toBe(201);
    expect(((await verse.json()) as { target: { verse: { reference: string } } }).target.verse.reference).toBe("John 3:16");
    expect((await call("POST", "/library/saved", { type: "hymn", key: "amazing-grace" })).status).toBe(201);
    const list = (await (await call("GET", "/library/saved")).json()) as { items: { target: { type: string; key: string; hymn: { title: string } | null } }[] };
    expect(list.items).toHaveLength(2);
    expect(list.items.find((item) => item.target.type === "hymn")?.target.hymn?.title).toBe("Amazing Grace");
    const missing = await call("POST", "/library/saved", { type: "hymn", key: "no-such-hymn" });
    expect(((await missing.json()) as { target: { hymn: null } }).target.hymn).toBeNull();
    expect((await call("DELETE", "/library/saved/hymn/no-such-hymn")).status).toBe(204);
    expect((await call("POST", "/library/saved", { type: "verse", key: "nonsense" })).status).toBe(400);
  });

  it("manages collections and their items", async () => {
    const created = await call("POST", "/library/collections", { name: "Sunday Set" });
    expect(created.status).toBe(201);
    const collection = (await created.json()) as { slug: string };
    expect(collection.slug).toBe("sunday-set");
    expect(((await (await call("POST", "/library/collections", { name: "Sunday Set" })).json()) as { slug: string }).slug).toBe("sunday-set-2");
    expect((await call("POST", `/library/collections/${collection.slug}/items`, { type: "hymn", key: "abide-with-me", note: "closing" })).status).toBe(201);
    expect((await call("POST", `/library/collections/${collection.slug}/items`, { type: "verse", key: "KJV:genesis:1:1" })).status).toBe(201);
    const detail = (await (await call("GET", `/library/collections/${collection.slug}`)).json()) as { items: { position: number; note: string | null; target: { key: string } }[] };
    expect(detail.items.map((item) => item.position)).toEqual([1, 2]);
    expect(detail.items[0]?.note).toBe("closing");
    const renamed = (await (await call("PATCH", `/library/collections/${collection.slug}`, { name: "Sunday Evening" })).json()) as { name: string; itemCount: number };
    expect(renamed.name).toBe("Sunday Evening");
    expect(renamed.itemCount).toBe(2);
    expect((await call("DELETE", `/library/collections/${collection.slug}/items/hymn/abide-with-me`)).status).toBe(204);
    const summaries = (await (await call("GET", "/library/collections")).json()) as { collections: { slug: string; itemCount: number }[] };
    expect(summaries.collections.find((entry) => entry.slug === collection.slug)?.itemCount).toBe(1);
    expect((await call("DELETE", `/library/collections/${collection.slug}`)).status).toBe(204);
    expect((await call("GET", `/library/collections/${collection.slug}`)).status).toBe(404);
  });

  it("keeps notes and history", async () => {
    const note = await call("PUT", "/library/notes/verse/KJV:john:3:16", { body: "Preached on this at Easter." });
    expect(note.status).toBe(200);
    const notes = (await (await call("GET", "/library/notes")).json()) as { notes: { body: string; target: { verse: { reference: string } } }[] };
    expect(notes.notes[0]?.target.verse.reference).toBe("John 3:16");
    expect((await call("DELETE", "/library/notes/verse/KJV:john:3:16")).status).toBe(204);

    const imported = await call("POST", "/library/history/import", {
      entries: [
        { kind: "identify", mode: "bible", query: "for god so loved", type: "verse", key: "KJV:john:3:16", occurredAt: "2026-09-01T10:00:00.000Z" },
        { kind: "search", query: "amazing grace", type: "hymn", key: "amazing-grace" },
      ],
    });
    expect(imported.status).toBe(201);
    expect(((await imported.json()) as { added: number }).added).toBe(2);
    expect((await call("POST", "/library/history", { kind: "view", query: "abide with me", type: "hymn", key: "abide-with-me" })).status).toBe(201);
    const history = (await (await call("GET", "/library/history?limit=10")).json()) as { entries: { kind: string; target: { hymn: { title: string } | null; verse: unknown } | null }[] };
    expect(history.entries).toHaveLength(3);
    expect(history.entries[0]?.kind).toBe("view");
    expect(history.entries[0]?.target?.hymn?.title).toBe("Abide with me");
    expect((await call("DELETE", "/library/history")).status).toBe(204);
    expect(((await (await call("GET", "/library/history")).json()) as { entries: unknown[] }).entries).toEqual([]);
  });
});
