import { describe, expect, it } from "vitest";
import { formatVerseKey, parseVerseKey, toLibraryTarget } from "../../src/services/library/index.js";

describe("verse keys", () => {
  it("parses and canonicalizes", () => {
    expect(parseVerseKey("kjv:John:3:16")).toEqual({ translation: "KJV", book: "john", chapter: 3, verse: 16 });
    expect(parseVerseKey("KJV:I Samuel:1:1")).toEqual({ translation: "KJV", book: "1-samuel", chapter: 1, verse: 1 });
    expect(formatVerseKey({ translation: "kjv", book: "psalms", chapter: 23, verse: 1 })).toBe("KJV:psalms:23:1");
  });

  it("rejects malformed keys", () => {
    expect(parseVerseKey("KJV:john:3")).toBeUndefined();
    expect(parseVerseKey("KJV:enoch:1:1")).toBeUndefined();
    expect(parseVerseKey("KJV:john:x:16")).toBeUndefined();
  });

  it("builds library targets or answers 400", () => {
    expect(toLibraryTarget("hymn", "amazing-grace")).toEqual({ targetType: "HYMN", targetKey: "amazing-grace" });
    expect(toLibraryTarget("verse", "kjv:john:3:16")).toEqual({ targetType: "VERSE", targetKey: "KJV:john:3:16" });
    expect(() => toLibraryTarget("hymn", "Not A Slug")).toThrow(/hymn slug/);
    expect(() => toLibraryTarget("verse", "john 3:16")).toThrow(/verse key/);
  });
});
