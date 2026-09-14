import { ValidationError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { cleanVerseText, parseKjvDataset, parseScrollmapperDataset } from "../../src/jobs/importBible/index.js";
import { createKjvFixture } from "../fixtures/kjv.fixture.js";

describe("parseKjvDataset", () => {
  it("maps books by position and verses by number", () => {
    const books = parseKjvDataset(createKjvFixture());
    expect(books).toHaveLength(66);
    expect(books[0]?.order).toBe(1);
    expect(books[0]?.chapters[0]?.[0]).toBe("In the beginning God created the heaven and the earth.");
    const john = books[42];
    expect(john?.order).toBe(43);
    expect(john?.chapters).toHaveLength(3);
    expect(john?.chapters[2]?.[15]).toContain("For God so loved the world");
    expect(john?.chapters[2]?.slice(0, 14).every((text) => text === "")).toBe(true);
    expect(john?.chapters[2]?.[16]).not.toContain("[");
  });

  it("rejects datasets with no recognisable books", () => {
    expect(() => parseKjvDataset({ books: [] })).toThrow(ValidationError);
    expect(() => parseKjvDataset({ books: [{ name: "Laodiceans", chapters: [] }] })).toThrow(ValidationError);
  });

  it("matches books by name, so Catholic orderings and appendices work", () => {
    const result = parseScrollmapperDataset({ books: [
      { name: "Tobit", chapters: [{ chapter: 1, verses: [{ verse: 1, text: "Tobias of the tribe of Nephtali." }] }] },
      { name: "Genesis", chapters: [] },
      { name: "Revelation of John", chapters: [] },
      { name: "Prayer of Manasses", chapters: [] },
      { name: "I Samuel", chapters: [] },
    ] }, "catholic");
    expect(result.books.map((book) => book.order)).toEqual([1, 9, 66, 67]);
    expect(result.skipped).toEqual(["Prayer of Manasses"]);
    const protestant = parseScrollmapperDataset({ books: [{ name: "Tobit", chapters: [] }, { name: "Genesis", chapters: [] }] }, "protestant");
    expect(protestant.books.map((book) => book.order)).toEqual([1]);
    expect(protestant.skipped).toEqual(["Tobit"]);
  });

  it("strips editorial brackets", () => {
    expect(cleanVerseText("the same hath not the Father: [but] he that")).toBe(
      "the same hath not the Father: but he that",
    );
  });
});
