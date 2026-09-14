import { describe, expect, it } from "vitest";
import { cleanLyricLine, cleanTitle, decodeDartString, parseSssDart, splitStanzas, toImportEntries } from "../../src/jobs/importHymns/index.js";

const SAMPLE = `List<Hymns> listHymns = <Hymns>[
  Hymns(
      id: 1,
      lyric:
          "Praise, my soul, the King of heaven ;\\nTo His feet thy tribute bring ;\\n \\n2\\n Praise Him for His grace and favour\\nTo our fathers in distress ;\\n",
      favorite: 0,
      title: "Praise, my soul, the King of heaven"),
  Hymns(
      id: 2,
      lyric:
          "In some way or other\\nThe Lord will provide:\\n\\n\\tThen we'll trust in the Lord,\\n\\tAnd He will provide :\\n\\n2\\n At some time or other\\nThe Lord will provide.\\n",
      favorite: 0,
      title: "The Lord will provide"),
  Hymns(
      id: 1201,
      lyric: "Modern anthem\\n",
      favorite: 0,
      title: "Oh God Be Glorified(ECWA International Anthem)"),
];`;

describe("Sacred Songs and Solos parser", () => {
  it("extracts hymns from the Dart source", () => {
    const hymns = parseSssDart(SAMPLE);
    expect(hymns.map((hymn) => hymn.number)).toEqual([1, 2, 1201]);
    expect(hymns[0]?.title).toBe("Praise, my soul, the King of heaven");
    expect(hymns[0]?.lyric.startsWith("Praise, my soul, the King of heaven ;\nTo His feet")).toBe(true);
  });

  it("decodes Dart escapes", () => {
    expect(decodeDartString('He said \\"go\\"\\nnow')).toBe('He said "go"\nnow');
  });

  it("cleans OCR artifacts", () => {
    expect(cleanLyricLine("Praise Him ! praise Him !")).toBe("Praise Him! praise Him!");
    expect(cleanLyricLine("Father- like He tends and spares us,")).toBe("Father-like He tends and spares us,");
    expect(cleanLyricLine("Him !Dwellers all in time and space,")).toBe("Him! Dwellers all in time and space,");
    expect(cleanLyricLine("the empty sinner's only [plea-----")).toBe("the empty sinner's only plea—");
    expect(cleanLyricLine('And armed with cruel hate "')).toBe("And armed with cruel hate");
    expect(cleanTitle("My country ! 'tis of thee.")).toBe("My country! 'tis of thee");
  });

  it("splits numbered verses and tab-indented choruses", () => {
    const stanzas = splitStanzas(parseSssDart(SAMPLE)[1]!.lyric);
    expect(stanzas.map((stanza) => [stanza.kind, stanza.number])).toEqual([
      ["verse", 1],
      ["chorus", null],
      ["verse", 2],
    ]);
    expect(stanzas[1]?.lines[0]).toBe("Then we'll trust in the Lord,");
    expect(stanzas[2]?.lines[0]).toBe("At some time or other");
  });

  it("drops the modern anthems beyond the 1200 pieces", () => {
    const entries = toImportEntries(parseSssDart(SAMPLE));
    expect(entries.map((entry) => entry.number)).toEqual([1, 2]);
    expect(entries[0]?.stanzas[0]?.lines[0]).toBe("Praise, my soul, the King of heaven;");
  });
});
