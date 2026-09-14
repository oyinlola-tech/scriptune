import { describe, expect, it } from "vitest";
import { hymnalFileSchema } from "../../src/jobs/importHymnal/index.js";

const valid = {
  hymnal: { slug: "ccc-hymnal", title: "Celestial Church of Christ Hymnal", rightsStatus: "used-by-permission" },
  source: { slug: "ccc-official", name: "Celestial Church of Christ", license: "Used by permission of the Celestial Church of Christ.", rightsStatus: "used-by-permission" },
  entries: [{ number: 1, title: "Halle, Halle", language: "yo", stanzas: [{ number: 1, kind: "verse", lines: ["Halle, halle, halleluya."] }] }],
};

describe("hymnalFileSchema", () => {
  it("accepts a well-formed used-by-permission hymnal", () => {
    const result = hymnalFileSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.hymnal.rightsStatus).toBe("used-by-permission");
  });

  it("defaults entry language to English", () => {
    const parsed = hymnalFileSchema.parse({ ...valid, entries: [{ number: 1, title: "A hymn", stanzas: [{ number: 1, kind: "verse", lines: ["Line one."] }] }] });
    expect(parsed.entries[0]?.language).toBe("en");
  });

  it("accepts a bilingual hymn with English and Yoruba texts", () => {
    const bilingual = { ...valid, entries: [{ number: 1, title: "Halle", texts: [
      { language: "en", stanzas: [{ number: 1, kind: "verse", lines: ["Praise the Lord."] }] },
      { language: "yo", stanzas: [{ number: 1, kind: "verse", lines: ["Ẹ yin Oluwa."] }] },
    ] }] };
    const result = hymnalFileSchema.safeParse(bilingual);
    expect(result.success).toBe(true);
    expect(result.data?.entries[0]?.texts?.length).toBe(2);
  });

  it("rejects an entry with neither stanzas nor texts", () => {
    expect(hymnalFileSchema.safeParse({ ...valid, entries: [{ number: 1, title: "Empty" }] }).success).toBe(false);
  });

  it("rejects a bad slug and empty entries", () => {
    expect(hymnalFileSchema.safeParse({ ...valid, hymnal: { ...valid.hymnal, slug: "Not A Slug" } }).success).toBe(false);
    expect(hymnalFileSchema.safeParse({ ...valid, entries: [] }).success).toBe(false);
  });
});
