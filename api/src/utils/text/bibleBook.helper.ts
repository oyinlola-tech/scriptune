import { CANONICAL_BOOKS, type CanonicalBook } from "../../constants/bible.books.js";

const ALIASES: Readonly<Record<string, string>> = Object.freeze({
  psalm: "psalms",
  "song-of-songs": "song-of-solomon",
  canticles: "song-of-solomon",
  revelations: "revelation",
  "revelation-of-john": "revelation",
  "acts-of-the-apostles": "acts",
  "canticle-of-canticles": "song-of-solomon",
  tobias: "tobit",
  "wisdom-of-solomon": "wisdom",
  ecclesiasticus: "sirach",
  "1-machabees": "1-maccabees",
  "2-machabees": "2-maccabees",
  "1-macc": "1-maccabees",
  "2-macc": "2-maccabees",
});

const ROMAN_PREFIXES: Readonly<Record<string, string>> = Object.freeze({
  i: "1",
  ii: "2",
  iii: "3",
});

/** Reduces any spelling of a book name to a comparable key. */
export function toBookKey(input: string): string {
  const key = input
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  const [prefix, ...rest] = key.split("-");
  if (prefix !== undefined && rest.length > 0 && ROMAN_PREFIXES[prefix] !== undefined) {
    return [ROMAN_PREFIXES[prefix], ...rest].join("-");
  }
  return key.replace(/^([123])(?=[a-z])/, "$1-");
}

const BY_KEY: ReadonlyMap<string, CanonicalBook> = (() => {
  const map = new Map<string, CanonicalBook>();
  for (const book of CANONICAL_BOOKS) {
    map.set(book.slug, book);
    map.set(toBookKey(book.abbreviation), book);
    map.set(String(book.order), book);
  }
  for (const [alias, slug] of Object.entries(ALIASES)) {
    const book = map.get(slug);
    if (book !== undefined) {
      map.set(alias, book);
    }
  }
  return map;
})();

/** Finds a canonical book by slug, name, abbreviation, order or alias. */
export function findCanonicalBook(reference: string): CanonicalBook | undefined {
  return BY_KEY.get(toBookKey(reference));
}

/** Returns the canonical book at a given order, or throws for an invalid order. */
export function canonicalBookAt(order: number): CanonicalBook | undefined {
  return CANONICAL_BOOKS[order - 1];
}
