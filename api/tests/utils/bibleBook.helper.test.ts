import { describe, expect, it } from "vitest";
import { CANONICAL_BOOKS } from "../../src/constants/index.js";
import { findCanonicalBook, toBookKey } from "../../src/utils/text/bibleBook.helper.js";

describe("canonical books", () => {
  it("has 66 Protestant books then 7 deuterocanonical ones, with unique slugs in order", () => {
    expect(CANONICAL_BOOKS).toHaveLength(73);
    expect(new Set(CANONICAL_BOOKS.map((book) => book.slug)).size).toBe(73);
    expect(CANONICAL_BOOKS.filter((book) => book.deuterocanonical).map((book) => book.slug)).toEqual(["tobit", "judith", "wisdom", "sirach", "baruch", "1-maccabees", "2-maccabees"]);
    expect(CANONICAL_BOOKS.slice(0, 66).every((book) => !book.deuterocanonical)).toBe(true);
    expect(CANONICAL_BOOKS.map((book) => book.order)).toEqual(CANONICAL_BOOKS.map((_, i) => i + 1));
    expect(CANONICAL_BOOKS[38]?.testament).toBe("OLD");
    expect(CANONICAL_BOOKS[39]?.name).toBe("Matthew");
  });

  it.each([
    ["john", "john"],
    ["John", "john"],
    ["1 Samuel", "1-samuel"],
    ["I Samuel", "1-samuel"],
    ["1sam", "1-samuel"],
    ["Ps", "psalms"],
    ["psalm", "psalms"],
    ["Song of Songs", "song-of-solomon"],
    ["Revelation of John", "revelation"],
    ["III John", "3-john"],
    ["43", "john"],
  ])("resolves %s", (input, slug) => {
    expect(findCanonicalBook(input)?.slug).toBe(slug);
  });

  it("returns undefined for unknown books", () => {
    expect(findCanonicalBook("enoch")).toBeUndefined();
  });

  it("normalizes keys", () => {
    expect(toBookKey(" II  Kings ")).toBe("2-kings");
    expect(toBookKey("1Kgs")).toBe("1-kgs");
  });
});
