import { ValidationError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { parseVplText } from "../../src/jobs/importBible/index.js";

const SAMPLE = [
  "GEN 1:1 In the beginning, God created the heavens and the earth.",
  "GEN 1:2 The earth was formless and empty.",
  "TOB 1:1 The book of the words of Tobit.",
  "ESG 1:1 [In the second year of the reign of Ahasuerus.]",
  "DNG 13:1 A man lived in Babylon, and his name was Joakim.",
  "3MA 1:1 Not part of any canon here.",
  "REV 22:21 The grace of the Lord Jesus Christ be with all the saints. Amen.",
].join("\n");

describe("parseVplText", () => {
  it("keeps the Protestant canon and reports the rest", () => {
    const result = parseVplText(SAMPLE, "protestant");
    expect(result.books.map((book) => book.order)).toEqual([1, 66]);
    expect(result.books[0]?.chapters[0]?.[1]).toBe("The earth was formless and empty.");
    expect(result.books[1]?.chapters).toHaveLength(22);
    expect(result.skipped).toEqual(["3MA", "DNG", "ESG", "TOB"]);
  });

  it("reads Greek Esther and Daniel as Esther and Daniel for a Catholic canon", () => {
    const result = parseVplText(SAMPLE, "catholic");
    expect(result.books.map((book) => book.order)).toEqual([1, 17, 27, 66, 67]);
    expect(result.books.find((book) => book.order === 27)?.chapters).toHaveLength(13);
    expect(result.books.find((book) => book.order === 17)?.chapters[0]?.[0]).toBe("In the second year of the reign of Ahasuerus.");
    expect(result.skipped).toEqual(["3MA"]);
  });

  it("prefers the Hebrew books when both are present", () => {
    const result = parseVplText(`${SAMPLE}\nEST 1:1 Now in the days of Ahasuerus.`, "catholic");
    expect(result.books.find((book) => book.order === 17)?.chapters[0]?.[0]).toBe("Now in the days of Ahasuerus.");
    expect(result.skipped).toEqual(["3MA", "ESG"]);
  });

  it("rejects text without verses", () => {
    expect(() => parseVplText("nothing here", "protestant")).toThrow(ValidationError);
  });
});
