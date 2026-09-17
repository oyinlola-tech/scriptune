import { describe, expect, it } from "vitest";
import { OSIS_CODES, parseOpenBibleCrossReferences } from "../../src/jobs/importCrossReferences/index.js";

const SAMPLE = [
  "From Verse\tTo Verse\tVotes\t#www.openbible.info CC-BY",
  "Gen.1.1\tHeb.1.10\t190",
  "Gen.1.1\tProv.8.22-Prov.8.30\t76",
  "Gen.1.1\tPs.89.11-Ps.90.2\t40",
  "Gen.1.1\tJohn.1.1\t30",
  "Gen.1.1\tIsa.45.18\t-4",
  "Gen.1.1\tHeb.1.10-Heb.1.12\t12",
  "John.3.16\tRom.5.8\t300",
  "Tob.1.1\tGen.1.1\t9",
].join("\n");

describe("OpenBible cross-reference parser", () => {
  it("knows all 66 books", () => {
    expect(OSIS_CODES).toHaveLength(66);
    expect(OSIS_CODES[18]).toBe("Ps");
    expect(OSIS_CODES[65]).toBe("Rev");
  });

  it("reads verses and same-chapter passages, strongest first", () => {
    const rows = parseOpenBibleCrossReferences(SAMPLE, { minVotes: 1, perVerse: 12 });
    const genesis = rows.filter((row) => row.fromBookId === 1);
    expect(genesis[0]).toEqual({ fromBookId: 1, fromChapter: 1, fromVerse: 1, toBookId: 58, toChapter: 1, toVerseStart: 10, toVerseEnd: 10, votes: 190 });
    expect(genesis[1]).toMatchObject({ toBookId: 20, toChapter: 8, toVerseStart: 22, toVerseEnd: 30 });
  });

  it("keeps only the first verse of a passage that crosses a chapter", () => {
    const psalm = parseOpenBibleCrossReferences(SAMPLE, { minVotes: 1, perVerse: 12 }).find((row) => row.toBookId === 19);
    expect(psalm).toMatchObject({ toChapter: 89, toVerseStart: 11, toVerseEnd: 11 });
  });

  it("drops down-voted links, unknown books and a weaker duplicate of the same target", () => {
    const rows = parseOpenBibleCrossReferences(SAMPLE, { minVotes: 1, perVerse: 12 });
    expect(rows.some((row) => row.toBookId === 23)).toBe(false);
    expect(rows.filter((row) => row.fromBookId === 1 && row.toBookId === 58)).toHaveLength(1);
    expect(rows).toHaveLength(5);
  });

  it("caps the links kept for one verse", () => {
    expect(parseOpenBibleCrossReferences(SAMPLE, { minVotes: 1, perVerse: 2 }).filter((row) => row.fromBookId === 1)).toHaveLength(2);
  });

  it("refuses a file with nothing usable in it", () => {
    expect(() => parseOpenBibleCrossReferences("not the dataset", { minVotes: 1, perVerse: 12 })).toThrow();
  });
});
