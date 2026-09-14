import type { TranslationUpsertInput } from "../../repositories/index.js";
import type { CanonName } from "./vpl.parser.js";

/** Commit of scrollmapper/bible_databases the JSON imports are pinned to. */
export const SCROLLMAPPER_COMMIT = "e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c";
const SCROLLMAPPER = "scrollmapper/bible_databases (MIT dataset of public-domain text)";
const EBIBLE = "eBible.org (public-domain text, verse-per-line export)";

function scrollmapperUrl(file: string): string {
  return `https://raw.githubusercontent.com/scrollmapper/bible_databases/${SCROLLMAPPER_COMMIT}/formats/json/${file}.json`;
}

/** An extra archive whose listed USFM books fill gaps in the main one. */
export interface BibleSupplement {
  readonly url: string;
  readonly entry: string;
  readonly codes: readonly string[];
}

export interface BibleSource {
  readonly code: string;
  readonly format: "scrollmapper" | "vpl";
  readonly canon: CanonName;
  readonly url: string;
  /** For zip downloads: the entry to read. */
  readonly entry?: string;
  readonly supplements?: readonly BibleSupplement[];
  readonly translation: TranslationUpsertInput;
}

function source(input: BibleSource): BibleSource {
  return Object.freeze({ ...input, translation: Object.freeze(input.translation) });
}

/**
 * Every translation Scriptune knows how to import. All are public domain;
 * copyrighted versions (NIV, ESV, NKJV and the like) cannot be added here
 * without a licence from their publishers.
 */
export const BIBLE_SOURCES: readonly BibleSource[] = Object.freeze([
  source({
    code: "KJV", format: "scrollmapper", canon: "protestant", url: scrollmapperUrl("KJV"),
    translation: { code: "KJV", name: "King James Version", language: "en", description: "King James Version (1769 Blayney text). Public domain.", rightsStatus: "public-domain", sourceName: SCROLLMAPPER, sourceUrl: scrollmapperUrl("KJV"), isDefault: true },
  }),
  source({
    code: "AKJV", format: "scrollmapper", canon: "protestant", url: scrollmapperUrl("AKJV"),
    translation: { code: "AKJV", name: "American King James Version", language: "en", description: "The King James text in modern American spelling and grammar (Michael Peter Engelbrite, 1999). Released into the public domain.", rightsStatus: "public-domain", sourceName: SCROLLMAPPER, sourceUrl: scrollmapperUrl("AKJV"), isDefault: false },
  }),
  source({
    code: "ASV", format: "scrollmapper", canon: "protestant", url: scrollmapperUrl("ASV"),
    translation: { code: "ASV", name: "American Standard Version", language: "en", description: "American Standard Version (1901). Public domain.", rightsStatus: "public-domain", sourceName: SCROLLMAPPER, sourceUrl: scrollmapperUrl("ASV"), isDefault: false },
  }),
  source({
    code: "WEB", format: "vpl", canon: "protestant", url: "https://ebible.org/Scriptures/eng-web_vpl.zip", entry: "eng-web_vpl.txt",
    translation: { code: "WEB", name: "World English Bible", language: "en", description: "World English Bible, a modern revision of the ASV by eBible.org. Public domain.", rightsStatus: "public-domain", sourceName: EBIBLE, sourceUrl: "https://ebible.org/Scriptures/eng-web_vpl.zip", isDefault: false },
  }),
  source({
    code: "WEBC", format: "vpl", canon: "catholic", url: "https://ebible.org/Scriptures/eng-web-c_vpl.zip", entry: "eng-web-c_vpl.txt",
    // eBible's Catholic verse-per-line export omits Genesis; the text is identical to the WEB, so it is taken from there.
    supplements: [{ url: "https://ebible.org/Scriptures/eng-web_vpl.zip", entry: "eng-web_vpl.txt", codes: ["GEN"] }],
    translation: { code: "WEBC", name: "World English Bible, Catholic Edition", language: "en", description: "World English Bible Catholic Edition with the deuterocanonical books, Greek Esther and Greek Daniel, by eBible.org. Public domain.", rightsStatus: "public-domain", sourceName: EBIBLE, sourceUrl: "https://ebible.org/Scriptures/eng-web-c_vpl.zip", isDefault: false },
  }),
  source({
    code: "DRC", format: "scrollmapper", canon: "catholic", url: scrollmapperUrl("DRC"),
    translation: { code: "DRC", name: "Douay-Rheims Bible", language: "en", description: "Douay-Rheims Bible, Challoner Revision (1752), with the deuterocanonical books and Vulgate psalm numbering. Public domain.", rightsStatus: "public-domain", sourceName: SCROLLMAPPER, sourceUrl: scrollmapperUrl("DRC"), isDefault: false },
  }),
]);

export function findBibleSource(code: string): BibleSource | undefined {
  return BIBLE_SOURCES.find((candidate) => candidate.code === code.toUpperCase());
}
