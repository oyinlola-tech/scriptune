import { describe, expect, it } from "vitest";
import { firstLineOf, stanzasToLyrics } from "../../src/modules/hymns/commands/index.js";
import { HymnSlugAllocator } from "../../src/services/hymns/index.js";
import { slugify } from "../../src/utils/text/slug.helper.js";

describe("slugify", () => {
  it("builds lowercase hyphenated slugs", () => {
    expect(slugify("Praise, my soul, the King of heaven!")).toBe("praise-my-soul-the-king-of-heaven");
    expect(slugify("  Olúwa   ni  ")).toBe("oluwa-ni");
  });
});

describe("HymnSlugAllocator", () => {
  it("keeps slugs for hymns imported before and disambiguates new clashes", () => {
    const allocator = new HymnSlugAllocator(new Map([["sss:5", "jesus-loves-me"]]), new Set(["jesus-loves-me", "abide-with-me"]));
    expect(allocator.allocate("sss:5", "Jesus loves me (new title)", 5)).toBe("jesus-loves-me");
    expect(allocator.allocate("sss:9", "Abide with me", 9)).toBe("abide-with-me-9");
    expect(allocator.allocate("sss:10", "Abide with me", 10)).toBe("abide-with-me-10");
    expect(allocator.allocate("sss:11", "!!!", 11)).toBe("hymn-11");
  });
});

describe("stanza helpers", () => {
  const stanzas = [
    { number: 1, kind: "verse" as const, lines: ["Amazing grace, how sweet the sound,", "That saved a wretch like me."] },
    { number: null, kind: "chorus" as const, lines: ["Praise God."] },
  ];

  it("joins stanzas into lyrics and picks the first verse line", () => {
    expect(stanzasToLyrics(stanzas)).toBe("Amazing grace, how sweet the sound,\nThat saved a wretch like me.\n\nPraise God.");
    expect(firstLineOf(stanzas)).toBe("Amazing grace, how sweet the sound,");
  });
});
