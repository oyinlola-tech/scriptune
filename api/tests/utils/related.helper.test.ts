import { describe, expect, it } from "vitest";
import { looksLikeSolfa, relateHymns, type RelatableHymn } from "../../src/utils/text/index.js";

const hymn = (hymnId: string, text: string, extra: Partial<RelatableHymn> = {}): RelatableHymn => ({ hymnId, language: "en", words: text.split(" "), chapters: [], ...extra });
const FILLER = Array.from({ length: 8 }, (_, index) => hymn(`filler-${index}`, `praise the lord with gladness number${index} sing aloud today`));
const OPTIONS = { perHymn: 3, minScore: 0.1, maxDocumentShare: 0.5, sharedChapterBonus: 0.1 };

describe("related hymns", () => {
  it("pairs hymns that share rare words, not common ones", () => {
    const hymns = [hymn("rock", "rock of ages cleft for me let me hide myself in thee"), hymn("cleft", "in thy cleft o rock of ages hide thou me"), ...FILLER];
    const related = relateHymns(hymns, OPTIONS).filter((relation) => relation.hymnId === "rock");
    expect(related[0]?.relatedHymnId).toBe("cleft");
    expect(related.some((relation) => relation.relatedHymnId.startsWith("filler"))).toBe(false);
  });

  it("never pairs across languages", () => {
    const hymns = [hymn("en", "rock of ages cleft for me"), hymn("yo", "rock of ages cleft for me", { language: "yo" }), ...FILLER];
    expect(relateHymns(hymns, OPTIONS).some((relation) => relation.hymnId === "en" && relation.relatedHymnId === "yo")).toBe(false);
  });

  it("counts a shared chapter of scripture and reports it", () => {
    const hymns = [hymn("a", "shepherd pastures green waters", { chapters: ["19:23"] }), hymn("b", "shepherd leadeth quiet waters", { chapters: ["19:23"] }), hymn("c", "shepherd leadeth quiet waters"), ...FILLER];
    const [first] = relateHymns(hymns, OPTIONS).filter((relation) => relation.hymnId === "a");
    expect(first).toMatchObject({ relatedHymnId: "b", sharedChapter: "19:23" });
  });

  it("caps how many hymns one hymn is paired with", () => {
    const hymns = Array.from({ length: 6 }, (_, index) => hymn(`h${index}`, `cleft rock ages hide verse${index}`)).concat(FILLER);
    expect(relateHymns(hymns, { ...OPTIONS, perHymn: 2 }).filter((relation) => relation.hymnId === "h0")).toHaveLength(2);
  });
});

describe("sol-fa titles", () => {
  it("recognises a line of tonic sol-fa", () => {
    expect(looksLikeSolfa("s:s:l:s:fe:s:s")).toBe(true);
    expect(looksLikeSolfa("s:d:-r:m:i:d:t:l:s")).toBe(true);
    expect(looksLikeSolfa("d r m f s l t d")).toBe(true);
  });

  it("leaves real titles alone", () => {
    expect(looksLikeSolfa("Amazing grace! how sweet the sound")).toBe(false);
    expect(looksLikeSolfa("So let me do")).toBe(false);
    expect(looksLikeSolfa("Olusọ Agutan")).toBe(false);
  });
});
