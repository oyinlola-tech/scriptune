import { describe, expect, it } from "vitest";
import { slugify } from "../../src/utils/text/slug.helper.js";

describe("slugify", () => {
  it("builds lowercase hyphenated ASCII slugs", () => {
    expect(slugify("Amazing Grace")).toBe("amazing-grace");
    expect(slugify("Ọ̀rọ̀ Ọlọ́run")).toBe("oro-olorun");
  });

  it("drops non-ASCII scripts and falls back so the slug always matches the route validator", () => {
    const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const name of ["赞美诗", "Псалмы", "🎵🎶", "   "]) {
      const slug = slugify(name, "collection");
      expect(valid.test(slug)).toBe(true);
    }
    expect(slugify("赞美诗", "collection")).toBe("collection");
  });
});
