import { describe, expect, it } from "vitest";
import { normalizeText, tokenize } from "../../src/utils/text/text.helper.js";

describe("normalizeText", () => {
  it("lowercases, strips punctuation and collapses whitespace", () => {
    expect(normalizeText("  For God so loved the world,  that he gave... ")).toBe(
      "for god so loved the world that he gave",
    );
  });

  it("drops apostrophes and accents", () => {
    expect(normalizeText("God’s grace — Olúwa")).toBe("gods grace oluwa");
  });

  it("tokenizes", () => {
    expect(tokenize("Amazing grace, how sweet!")).toEqual(["amazing", "grace", "how", "sweet"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("toAnyPairQuery", () => {
  it("pairs the stronger words and drops filler", async () => {
    const { toAnyPairQuery } = await import("../../src/utils/text/text.helper.js");
    expect(toAnyPairQuery("amazing grace how sweet the sound")).toBe("amazing & grace | amazing & sweet | amazing & sound | grace & sweet | grace & sound | sweet & sound");
    expect(toAnyPairQuery("the lord is my")).toBeNull();
    expect(toAnyPairQuery("olorun mi")).toBeNull();
    expect(toAnyPairQuery("olorun agbaye")).toBe("olorun & agbaye");
  });
});
