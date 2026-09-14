export type TestamentName = "OLD" | "NEW";

/**
 * A book shared by every translation: the 66 of the Protestant canon in
 * order, then the seven deuterocanonical books Catholic editions add.
 */
export interface CanonicalBook {
  /** Canonical order, 1 to 73. Doubles as the database id. */
  readonly order: number;
  readonly slug: string;
  readonly name: string;
  readonly abbreviation: string;
  readonly testament: TestamentName;
  /** True for the seven books found in Catholic editions but not Protestant ones. */
  readonly deuterocanonical: boolean;
}

function book(order: number, name: string, abbreviation: string, testament: TestamentName, deuterocanonical = false): CanonicalBook {
  return Object.freeze({
    order,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    abbreviation,
    testament,
    deuterocanonical,
  });
}

/** Every known book in canonical order. Index `order - 1` is the book itself. */
export const CANONICAL_BOOKS: readonly CanonicalBook[] = Object.freeze([
  book(1, "Genesis", "Gen", "OLD"), book(2, "Exodus", "Exod", "OLD"),
  book(3, "Leviticus", "Lev", "OLD"), book(4, "Numbers", "Num", "OLD"),
  book(5, "Deuteronomy", "Deut", "OLD"), book(6, "Joshua", "Josh", "OLD"),
  book(7, "Judges", "Judg", "OLD"), book(8, "Ruth", "Ruth", "OLD"),
  book(9, "1 Samuel", "1Sam", "OLD"), book(10, "2 Samuel", "2Sam", "OLD"),
  book(11, "1 Kings", "1Kgs", "OLD"), book(12, "2 Kings", "2Kgs", "OLD"),
  book(13, "1 Chronicles", "1Chr", "OLD"), book(14, "2 Chronicles", "2Chr", "OLD"),
  book(15, "Ezra", "Ezra", "OLD"), book(16, "Nehemiah", "Neh", "OLD"),
  book(17, "Esther", "Esth", "OLD"), book(18, "Job", "Job", "OLD"),
  book(19, "Psalms", "Ps", "OLD"), book(20, "Proverbs", "Prov", "OLD"),
  book(21, "Ecclesiastes", "Eccl", "OLD"), book(22, "Song of Solomon", "Song", "OLD"),
  book(23, "Isaiah", "Isa", "OLD"), book(24, "Jeremiah", "Jer", "OLD"),
  book(25, "Lamentations", "Lam", "OLD"), book(26, "Ezekiel", "Ezek", "OLD"),
  book(27, "Daniel", "Dan", "OLD"), book(28, "Hosea", "Hos", "OLD"),
  book(29, "Joel", "Joel", "OLD"), book(30, "Amos", "Amos", "OLD"),
  book(31, "Obadiah", "Obad", "OLD"), book(32, "Jonah", "Jonah", "OLD"),
  book(33, "Micah", "Mic", "OLD"), book(34, "Nahum", "Nah", "OLD"),
  book(35, "Habakkuk", "Hab", "OLD"), book(36, "Zephaniah", "Zeph", "OLD"),
  book(37, "Haggai", "Hag", "OLD"), book(38, "Zechariah", "Zech", "OLD"),
  book(39, "Malachi", "Mal", "OLD"),
  book(40, "Matthew", "Matt", "NEW"), book(41, "Mark", "Mark", "NEW"),
  book(42, "Luke", "Luke", "NEW"), book(43, "John", "John", "NEW"),
  book(44, "Acts", "Acts", "NEW"), book(45, "Romans", "Rom", "NEW"),
  book(46, "1 Corinthians", "1Cor", "NEW"), book(47, "2 Corinthians", "2Cor", "NEW"),
  book(48, "Galatians", "Gal", "NEW"), book(49, "Ephesians", "Eph", "NEW"),
  book(50, "Philippians", "Phil", "NEW"), book(51, "Colossians", "Col", "NEW"),
  book(52, "1 Thessalonians", "1Thess", "NEW"), book(53, "2 Thessalonians", "2Thess", "NEW"),
  book(54, "1 Timothy", "1Tim", "NEW"), book(55, "2 Timothy", "2Tim", "NEW"),
  book(56, "Titus", "Titus", "NEW"), book(57, "Philemon", "Phlm", "NEW"),
  book(58, "Hebrews", "Heb", "NEW"), book(59, "James", "Jas", "NEW"),
  book(60, "1 Peter", "1Pet", "NEW"), book(61, "2 Peter", "2Pet", "NEW"),
  book(62, "1 John", "1John", "NEW"), book(63, "2 John", "2John", "NEW"),
  book(64, "3 John", "3John", "NEW"), book(65, "Jude", "Jude", "NEW"),
  book(66, "Revelation", "Rev", "NEW"),
  book(67, "Tobit", "Tob", "OLD", true), book(68, "Judith", "Jdt", "OLD", true),
  book(69, "Wisdom", "Wis", "OLD", true), book(70, "Sirach", "Sir", "OLD", true),
  book(71, "Baruch", "Bar", "OLD", true), book(72, "1 Maccabees", "1Macc", "OLD", true),
  book(73, "2 Maccabees", "2Macc", "OLD", true),
]);

/** Books of the Protestant canon only (orders 1 to 66). */
export const PROTESTANT_BOOK_COUNT = 66;

export const CANONICAL_BOOK_COUNT = CANONICAL_BOOKS.length;
