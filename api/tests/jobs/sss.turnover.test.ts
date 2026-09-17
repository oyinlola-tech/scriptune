import { describe, expect, it } from "vitest";
import { cleanLyricLine, splitStanzas } from "../../src/jobs/importHymns/index.js";
import { repairTurnovers } from "../../src/jobs/importHymns/sss.turnover.js";

const lines = (lyric: string): string[][] => splitStanzas(lyric).map((stanza) => [...stanza.lines]);

describe("turned-over words", () => {
  it("returns a word to the unfinished line above it", () => {
    expect(lines("Through many dangers, toils, and \nI have already come : [snares, \n'Tis grace that brought me safe thus far,\nAnd grace will lead me home,")).toEqual([
      ["Through many dangers, toils, and snares,", "I have already come:", "'Tis grace that brought me safe thus far,", "And grace will lead me home,"],
    ]);
  });

  it("returns a word to the unfinished line below it", () => {
    expect(lines("\"To you, in David's town, this day,\nIs born of David's line [Lord;\nThe Saviour, who is Christ the\nAnd this shall be the sign:")[0]).toEqual([
      "To you, in David's town, this day,", "Is born of David's line", "The Saviour, who is Christ the Lord;", "And this shall be the sign:",
    ]);
  });

  it("closes a word split by a hyphen", () => {
    expect(lines("And through all His wondrous child- \nHe would honour and obey, [hood \nLove and watch the lowly mother")[0]?.[0]).toBe("And through all His wondrous childhood");
  });

  it("joins a wrapped line and gives its turnover to the line below", () => {
    expect(lines("Weary with my blindness, waiting all \nthe day, [pain ; \nWeary with my sorrow and my \nJesus, I am coming.")[0]).toEqual([
      "Weary with my blindness, waiting all the day,", "Weary with my sorrow and my pain;", "Jesus, I am coming.",
    ]);
  });

  it("joins a capitalised scrap that finishes the line above", () => {
    expect(lines("He is my Refuge, my Rock, and my \nTower — [my Power ; \nHe is my Fortress, my Strength and \nBlessed Redeemer — Jesus for me !")[0]?.slice(0, 2)).toEqual([
      "He is my Refuge, my Rock, and my Tower —", "He is my Fortress, my Strength and my Power;",
    ]);
  });

  it("leaves a short line of its own alone", () => {
    expect(lines("Safe in the arms that guard from \nJesus, my Guide, [harms, \nProtect me still, keep me from ill, \nClose to Thy side.")[0]?.slice(0, 2)).toEqual([
      "Safe in the arms that guard from harms,", "Jesus, my Guide,",
    ]);
  });

  it("prefers the line that ends on a word no line ends on", () => {
    expect(lines("What wilt thou do when storms \nUpon thy house are beating ? [sands \nWhen from beneath, the treacherous \nThat held thee are retreating ?")[0]?.[2]).toBe("When from beneath, the treacherous sands");
  });

  it("reaches into the next stanza when that is where the line waits", () => {
    const blocks = repairTurnovers([["Swift to our heavenly country move,", "Our everlasting home above, [borne,"], ["3"], ["Through Thee, who all our sins hast", "Freely and graciously forgiven,"]]);
    expect(blocks[0]?.[1]).toBe("Our everlasting home above,");
    expect(blocks[2]?.[0]).toBe("Through Thee, who all our sins hast borne,");
  });

  it("drops a bracket the dataset left beside an already repaired line", () => {
    expect(lines("Blessed Redeemer, full of compassion,\nGreat is Thy mercy, boundless and free; [favour,\nNow in my weakness, seeking Thy favour,\nLord, I am coming closer to Thee.")[0]?.[1]).toBe("Great is Thy mercy, boundless and free;");
  });

  it("drops scanner debris and keeps a closing Amen at the end", () => {
    expect(lines("Drop the anchor ! furl the sail !\nI am safe within the vail ! [j n g . ")[0]).toEqual(["Drop the anchor! furl the sail!", "I am safe within the vail!"]);
    expect(lines("For Thee to live, in Thee to die, [Amen. \nWith Thee to reign through Eternity. ")[0]).toEqual(["For Thee to live, in Thee to die,", "With Thee to reign through Eternity. Amen."]);
  });

  it("does not touch a line that merely repeats a word", () => {
    expect(lines("Holy, holy, holy ! Lord God Almighty !\nEarly in the morning our song shall rise to Thee ;")[0]).toEqual([
      "Holy, holy, holy! Lord God Almighty!", "Early in the morning our song shall rise to Thee;",
    ]);
  });

  it("keeps a lower-case line that follows a full stop, where a capital was lost", () => {
    expect(lines("His might has won the field : \nhy strength is in the Lord !")[0]).toHaveLength(2);
  });
});

describe("refrains and verse numbers", () => {
  it("treats an unnumbered block among numbered verses as the refrain", () => {
    const stanzas = splitStanzas("There is a gate that stands ajar,\nAnd through its portals gleaming\n\nOh, depth of mercy ! can it be\nThat gate was left ajar for me ?\n\n2\n That gate ajar stands free for all\nWho seek through it salvation ;");
    expect(stanzas.map((stanza) => [stanza.kind, stanza.number])).toEqual([["verse", 1], ["chorus", null], ["verse", 2]]);
  });

  it("numbers unlabelled stanzas in order when the hymn has no numbers at all", () => {
    expect(splitStanzas("First verse line\nSecond line\n\nAnother verse\nAnd its line").map((stanza) => stanza.number)).toEqual([1, 2]);
  });

  it("reads a verse number left on the verse's first line", () => {
    const stanzas = splitStanzas("Rejoice and be glad ! the Redeemer has come !\n\n2\n Rejoice and be glad ! it is sunshine at last !\n\n3 Rejoice and be glad ! for the blood hath been shed ;");
    expect(stanzas.map((stanza) => stanza.number)).toEqual([1, 2, 3]);
    expect(stanzas[2]?.lines[0]).toBe("Rejoice and be glad! for the blood hath been shed;");
  });
});

describe("scanner artefacts", () => {
  it("restores exclamation marks, I and O, dashes and the word content", () => {
    expect(cleanLyricLine("Come, sinner, come 1")).toBe("Come, sinner, come!");
    expect(cleanLyricLine("O Calvary 1 blest Calvary !")).toBe("O Calvary! blest Calvary!");
    expect(cleanLyricLine("1 can tarry, I can tarry but a night")).toBe("I can tarry, I can tarry but a night");
    expect(cleanLyricLine("0 my precious Saviour,")).toBe("O my precious Saviour,");
    expect(cleanLyricLine("How sad this life would be â€”")).toBe("How sad this life would be —");
    expect(cleanLyricLine("lyric, whatever lot I see,")).toBe("Content, whatever lot I see,");
    expect(cleanLyricLine("I am lyric ; for this I know")).toBe("I am content; for this I know");
  });
});
