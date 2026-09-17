import { describe, expect, it } from "vitest";
import { findScriptureEchoes, type EchoVerse } from "../../src/utils/text/index.js";

const words = (text: string): string[] => text.split(" ");

/** A small Bible: two distinctive verses, and a formula repeated often enough to be no evidence of anything. */
const VERSES: EchoVerse[] = [
  { bookId: 43, chapter: 20, verse: 25, words: words("except i shall see in his hands the print of the nails") },
  { bookId: 66, chapter: 22, verse: 16, words: words("i am the root and the offspring of david and the bright and morning star") },
  ...Array.from({ length: 20 }, (_, index) => ({ bookId: 1, chapter: 1, verse: index + 1, words: words(`and it came to pass on day ${index}`) })),
];
const OPTIONS = { run: 4, maxVersesPerRun: 12, minScore: 4, perHymn: 4 };

describe("scripture echoes", () => {
  it("links a hymn to the verse it quotes and reports the shared phrase", () => {
    const echoes = findScriptureEchoes(VERSES, [{ hymnId: "h1", words: words("i shall know him by the print of the nails in his hand") }], OPTIONS);
    expect(echoes).toHaveLength(1);
    expect(echoes[0]).toMatchObject({ hymnId: "h1", bookId: 43, chapter: 20, verse: 25, phrase: "the print of the nails" });
  });

  it("ignores a run of words that half the Bible shares", () => {
    expect(findScriptureEchoes(VERSES, [{ hymnId: "h2", words: words("and it came to pass that we sang") }], OPTIONS)).toHaveLength(0);
  });

  it("needs the words in a row, not merely present", () => {
    expect(findScriptureEchoes(VERSES, [{ hymnId: "h3", words: words("the nails the print the star the morning") }], OPTIONS)).toHaveLength(0);
  });

  it("drops matches whose shared words are too ordinary to mean anything", () => {
    const strict = { ...OPTIONS, minScore: 50 };
    expect(findScriptureEchoes(VERSES, [{ hymnId: "h1", words: words("by the print of the nails") }], strict)).toHaveLength(0);
  });

  it("keeps only the strongest few for one hymn", () => {
    const hymn = { hymnId: "h4", words: words("the print of the nails and the bright and morning star") };
    expect(findScriptureEchoes(VERSES, [hymn], { ...OPTIONS, perHymn: 1 })).toHaveLength(1);
    expect(findScriptureEchoes(VERSES, [hymn], OPTIONS)).toHaveLength(2);
  });
});
