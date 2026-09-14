import type { ImportHymnalInput } from "../../src/modules/hymns/commands/index.js";

/** Three public-domain hymns shaped like an import. */
export function createHymnalFixture(): ImportHymnalInput {
  return {
    source: {
      slug: "fixture-source",
      name: "Fixture",
      license: "Public domain",
      rightsStatus: "public-domain",
      retrievedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    hymnal: { slug: "fixture-hymnal", title: "Fixture Hymnal", rightsStatus: "public-domain" },
    entries: [
      {
        number: 1,
        title: "Amazing Grace",
        language: "en",
        stanzas: [
          { number: 1, kind: "verse", lines: ["Amazing grace! how sweet the sound,", "That saved a wretch like me!", "I once was lost, but now am found,", "Was blind, but now I see."] },
          { number: 2, kind: "verse", lines: ["'Twas grace that taught my heart to fear,", "And grace my fears relieved;"] },
        ],
      },
      {
        number: 2,
        title: "Abide with me",
        language: "en",
        stanzas: [{ number: 1, kind: "verse", lines: ["Abide with me: fast falls the eventide;", "The darkness deepens; Lord, with me abide."] }],
      },
      {
        number: 3,
        title: "Amazing Grace",
        language: "en",
        stanzas: [{ number: 1, kind: "verse", lines: ["A different hymn with the same title,", "to exercise slug disambiguation."] }],
      },
    ],
  };
}
