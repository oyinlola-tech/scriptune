import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Runtime } from "@zudojs/runtime";
import { createApp } from "../../src/app.js";
import { TOKENS } from "../../src/constants/index.js";
import { parseKjvDataset } from "../../src/jobs/importBible/index.js";
import { ImportTranslationCommand, type ImportTranslationResult } from "../../src/modules/bible/commands/index.js";
import { createKjvFixture } from "../fixtures/kjv.fixture.js";
import { TEST_ENV } from "../helpers/testApp.helper.js";

const databaseUrl = process.env["TEST_DATABASE_URL"];

describe.skipIf(databaseUrl === undefined)("bible integration", () => {
  let runtime: Runtime;
  let baseUrl: string;

  beforeAll(async () => {
    runtime = await createApp({ env: { ...TEST_ENV, DATABASE_URL: databaseUrl } });
    await runtime.start();
    const port = runtime.context.container.resolve(TOKENS.httpServer).address?.port;
    baseUrl = `http://127.0.0.1:${port}`;
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    const result = await commandBus.execute<ImportTranslationCommand, ImportTranslationResult>(
      new ImportTranslationCommand({
        translation: {
          code: "KJV",
          name: "King James Version",
          language: "en",
          rightsStatus: "public-domain",
          sourceName: "fixture",
          isDefault: true,
        },
        books: parseKjvDataset(createKjvFixture()),
      }),
    );
    expect(result.verseCount).toBe(7);
  });

  afterAll(async () => {
    await runtime?.stop();
  });

  it("lists translations and books", async () => {
    const translations = (await (await fetch(`${baseUrl}/bible/translations`)).json()) as { translations: { code: string; verseCount: number }[] };
    expect(translations.translations[0]).toMatchObject({ code: "KJV", verseCount: 7 });
    const books = (await (await fetch(`${baseUrl}/bible/kjv/books`)).json()) as { books: { slug: string; chapterCount: number }[] };
    expect(books.books).toHaveLength(66);
    expect(books.books.find((book) => book.slug === "john")?.chapterCount).toBe(3);
  });

  it("reads a chapter and a verse with context", async () => {
    const chapter = (await (await fetch(`${baseUrl}/bible/KJV/john/3`)).json()) as { verses: { verse: number }[] };
    expect(chapter.verses.map((verse) => verse.verse)).toEqual([15, 16, 17]);
    const verse = (await (await fetch(`${baseUrl}/bible/kjv/John/3/16?context=1`)).json()) as {
      verse: { reference: string; text: string };
      context: { before: unknown[]; after: unknown[] };
    };
    expect(verse.verse.reference).toBe("John 3:16");
    expect(verse.verse.text).toContain("everlasting life");
    expect(verse.context.before).toHaveLength(1);
    expect(verse.context.after).toHaveLength(1);
  });

  it("answers 404 and 400 for bad references", async () => {
    expect((await fetch(`${baseUrl}/bible/kjv/enoch/1`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/bible/kjv/john/99`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/bible/kjv/john/3/99`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/bible/niv/john/3`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/bible/kjv/john/abc`)).status).toBe(400);
    expect((await fetch(`${baseUrl}/bible/kjv/search?q=a`)).status).toBe(400);
  });

  it("searches verses by full text and by fuzzy phrase", async () => {
    const exact = (await (await fetch(`${baseUrl}/bible/kjv/search?q=${encodeURIComponent("God so loved the world")}`)).json()) as { results: { reference: string; score: number }[] };
    expect(exact.results[0]?.reference).toBe("John 3:16");
    const fuzzy = (await (await fetch(`${baseUrl}/bible/kjv/search?q=${encodeURIComponent("in the beginning god created")}`)).json()) as { results: { reference: string }[] };
    expect(fuzzy.results[0]?.reference).toBe("Genesis 1:1");
  });

  it("exports a whole translation for offline clients", async () => {
    const response = await fetch(`${baseUrl}/export/bible/kjv`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=86400");
    const dump = (await response.json()) as { translation: { code: string }; verseCount: number; books: { order: number; slug: string }[]; verses: [number, number, number, string][] };
    expect(dump.translation.code).toBe("KJV");
    expect(dump.verseCount).toBe(dump.verses.length);
    expect(dump.books.length).toBe(66);
    const genesis = dump.books.find((book) => book.slug === "genesis");
    expect(dump.verses[0]).toEqual([genesis?.order, 1, 1, "In the beginning God created the heaven and the earth."]);
    expect((await fetch(`${baseUrl}/export/bible/nope`)).status).toBe(404);
  });

  it("keeps books and chapter counts per translation", async () => {
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    await commandBus.execute<ImportTranslationCommand, ImportTranslationResult>(
      new ImportTranslationCommand({
        translation: { code: "TST", name: "Test Catholic Edition", language: "en", rightsStatus: "public-domain", sourceName: "fixture", isDefault: false },
        books: [
          { order: 17, chapters: Array.from({ length: 16 }, (_, index) => (index === 15 ? ["Greek addition."] : ["Verse."])) },
          { order: 67, chapters: [["The book of the words of Tobit."]] },
        ],
      }),
    );
    const tst = (await (await fetch(`${baseUrl}/bible/tst/books`)).json()) as { books: { slug: string; chapterCount: number; deuterocanonical: boolean }[] };
    expect(tst.books.map((book) => book.slug)).toEqual(["esther", "tobit"]);
    expect(tst.books[0]?.chapterCount).toBe(16);
    expect(tst.books[1]?.deuterocanonical).toBe(true);
    const kjv = (await (await fetch(`${baseUrl}/bible/kjv/books`)).json()) as { books: { slug: string }[] };
    expect(kjv.books).toHaveLength(66);
    expect((await fetch(`${baseUrl}/bible/kjv/tobit/1`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/bible/tst/esther/16`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/bible/tst/tobit/1/1`)).status).toBe(200);
    const dump = (await (await fetch(`${baseUrl}/export/bible/tst`)).json()) as { books: { slug: string }[]; verseCount: number };
    expect(dump.books.map((book) => book.slug)).toEqual(["esther", "tobit"]);
    expect(dump.verseCount).toBe(17);
  });
});
