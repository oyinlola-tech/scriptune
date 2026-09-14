import { NotFoundError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { CANONICAL_BOOKS } from "../../src/constants/index.js";
import type { BookModel, TranslationModel, VerseModel, VerseSearchHit } from "../../src/models/index.js";
import { GetVerseHandler, GetVerseQuery, SearchVersesHandler, SearchVersesQuery } from "../../src/modules/bible/queries/index.js";
import type { BookRepository, TranslationRepository, VerseRepository, VerseSearchInput } from "../../src/repositories/index.js";
import { BibleLookup } from "../../src/services/bible/index.js";

const translation: TranslationModel = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "KJV",
  name: "King James Version",
  language: "en",
  description: null,
  rightsStatus: "public-domain",
  sourceName: "test",
  sourceUrl: null,
  isDefault: true,
  verseCount: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const john: BookModel = { ...CANONICAL_BOOKS[42]!, id: 43, chapterCount: 21 };

const verses: VerseModel[] = [15, 16, 17].map((verse) => ({
  id: verse,
  translationId: translation.id,
  bookId: 43,
  chapter: 3,
  verse,
  text: `Verse ${verse}`,
}));

const translations: TranslationRepository = {
  findAll: async () => [translation],
  findByCode: async (code) => (code === "KJV" ? translation : null),
  upsert: async () => translation,
  setVerseCount: async () => undefined,
};

const books: BookRepository = {
  findAll: async () => [john],
  findById: async (id) => (id === 43 ? john : null),
  findForTranslation: async () => [john],
  findInTranslation: async (_translationId, id) => (id === 43 ? john : null),
  upsertMany: async () => undefined,
  replaceTranslationBooks: async () => undefined,
};

let lastSearch: VerseSearchInput | undefined;
const verseRepository: VerseRepository = {
  findChapter: async () => verses,
  findVerse: async (_t, _b, chapter, verse) => verses.find((v) => v.chapter === chapter && v.verse === verse) ?? null,
  findRange: async (_t, _b, _c, from, to) => verses.filter((v) => v.verse >= from && v.verse <= to),
  replaceForTranslation: async () => 0,
  search: async (_t, input) => {
    lastSearch = input;
    const hit: VerseSearchHit = { ...verses[1]!, score: 0.87654, rank: 0.5, similarity: 0.9 };
    return [hit];
  },
};

const lookup = new BibleLookup(translations, books);

describe("GetVerseHandler", () => {
  const handler = new GetVerseHandler(lookup, verseRepository);

  it("returns the verse with surrounding context", async () => {
    const result = await handler.execute(
      new GetVerseQuery({ translation: "kjv", book: "John", chapter: 3, verse: 16, context: 1 }),
    );
    expect(result.verse.reference).toBe("John 3:16");
    expect(result.context.before.map((v) => v.verse)).toEqual([15]);
    expect(result.context.after.map((v) => v.verse)).toEqual([17]);
    expect(result.translation.code).toBe("KJV");
  });

  it("rejects unknown translations, books, chapters and verses", async () => {
    await expect(handler.execute(new GetVerseQuery({ translation: "NIV", book: "John", chapter: 3, verse: 16 }))).rejects.toBeInstanceOf(NotFoundError);
    await expect(handler.execute(new GetVerseQuery({ translation: "KJV", book: "Enoch", chapter: 1, verse: 1 }))).rejects.toBeInstanceOf(NotFoundError);
    await expect(handler.execute(new GetVerseQuery({ translation: "KJV", book: "John", chapter: 99, verse: 1 }))).rejects.toThrow(/21 chapters/);
    await expect(handler.execute(new GetVerseQuery({ translation: "KJV", book: "John", chapter: 3, verse: 99 }))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("SearchVersesHandler", () => {
  const handler = new SearchVersesHandler(lookup, translations, books, verseRepository);

  it("normalizes the query and rounds scores", async () => {
    const result = await handler.execute(new SearchVersesQuery("kjv", "For God so LOVED the world!", 5));
    expect(lastSearch?.normalizedText).toBe("for god so loved the world");
    expect(lastSearch?.limit).toBe(5);
    expect(result.results[0]?.reference).toBe("John 3:16");
    expect(result.results[0]?.score).toBe(0.877);
  });

  it("short-circuits queries that normalize to nothing", async () => {
    const result = await handler.execute(new SearchVersesQuery("KJV", "!!! ...", 5));
    expect(result.results).toEqual([]);
  });
});
