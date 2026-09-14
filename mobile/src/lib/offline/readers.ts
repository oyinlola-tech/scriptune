import type { BookDto, ChapterDto, HymnDetailDto, Stanza, VerseDetailDto, VerseDto } from "@scriptune/contracts";
import { openDatabase } from "./database";

interface BookRow { ord: number; slug: string; name: string; abbreviation: string; testament: "OLD" | "NEW"; deuterocanonical: number; chapter_count: number }
interface VerseRow { book_ord: number; chapter: number; verse: number; text: string }
interface HymnRow { hymnal: string; number: number; slug: string; title: string; language: string; first_line: string; stanzas: string; rights_status: string }

function toBookDto(row: BookRow): BookDto {
  return { slug: row.slug, name: row.name, abbreviation: row.abbreviation, testament: row.testament, deuterocanonical: row.deuterocanonical === 1, order: row.ord, chapterCount: row.chapter_count };
}

function toVerseDto(book: BookRow, row: VerseRow): VerseDto {
  return { reference: `${book.name} ${row.chapter}:${row.verse}`, book: { slug: book.slug, name: book.name, abbreviation: book.abbreviation }, chapter: row.chapter, verse: row.verse, text: row.text };
}

/** Finds a book by slug, name or abbreviation, as the API does. */
async function findBook(translation: string, book: string): Promise<BookRow | null> {
  const db = await openDatabase();
  const needle = book.trim().toLowerCase();
  return db.getFirstAsync<BookRow>(
    "SELECT ord, slug, name, abbreviation, testament, deuterocanonical, chapter_count FROM books WHERE translation = ? AND (slug = ? OR lower(name) = ? OR lower(abbreviation) = ?)",
    translation, needle, needle, needle,
  );
}

/** Reads a verse with two neighbours on each side from the device copy, or null when it is not downloaded. */
export async function readLocalVerse(translationCode: string, bookRef: string, chapter: number, verse: number): Promise<VerseDetailDto | null> {
  const translation = translationCode.toUpperCase();
  const db = await openDatabase();
  const corpus = await db.getFirstAsync<{ title: string }>("SELECT title FROM corpora WHERE kind = 'bible' AND id = ?", translation);
  if (corpus === null) return null;
  const book = await findBook(translation, bookRef);
  if (book === null) return null;
  const rows = await db.getAllAsync<VerseRow>(
    "SELECT book_ord, chapter, verse, text FROM verses WHERE translation = ? AND book_ord = ? AND chapter = ? AND verse BETWEEN ? AND ? ORDER BY verse",
    translation, book.ord, chapter, verse - 2, verse + 2,
  );
  const target = rows.find((row) => row.verse === verse);
  if (target === undefined) return null;
  return {
    translation: { code: translation, name: corpus.title },
    verse: toVerseDto(book, target),
    context: { before: rows.filter((row) => row.verse < verse).map((row) => toVerseDto(book, row)), after: rows.filter((row) => row.verse > verse).map((row) => toVerseDto(book, row)) },
  };
}

/** Reads a hymn from the device copy, or null when its hymnal is not downloaded. */
export async function readLocalHymn(slug: string): Promise<HymnDetailDto | null> {
  const db = await openDatabase();
  const rows = await db.getAllAsync<HymnRow>("SELECT * FROM hymns WHERE slug = ? ORDER BY hymnal", slug);
  const row = rows[0];
  if (row === undefined) return null;
  const hymnals = await db.getAllAsync<{ id: string; title: string }>("SELECT id, title FROM corpora WHERE kind = 'hymnal'");
  const titleOf = (id: string) => hymnals.find((entry) => entry.id === id)?.title ?? id;
  const stanzas = JSON.parse(row.stanzas) as Stanza[];
  return {
    slug: row.slug,
    title: row.title,
    alternateTitles: [],
    year: null,
    meter: null,
    tuneName: null,
    rightsStatus: row.rights_status,
    texts: [{ language: row.language, variant: "default", title: row.title, firstLine: row.first_line, stanzas, rightsStatus: row.rights_status }],
    contributors: [],
    placements: rows.map((entry) => ({ hymnal: { slug: entry.hymnal, title: titleOf(entry.hymnal) }, number: entry.number })),
    topics: [],
    scriptureReferences: [],
  };
}

/** The books of a downloaded translation, or null when it is not on the device. */
export async function listLocalBooks(translationCode: string): Promise<{ translation: { code: string; name: string }; books: BookDto[] } | null> {
  const translation = translationCode.toUpperCase();
  const db = await openDatabase();
  const corpus = await db.getFirstAsync<{ title: string }>("SELECT title FROM corpora WHERE kind = 'bible' AND id = ?", translation);
  if (corpus === null) return null;
  const rows = await db.getAllAsync<BookRow>("SELECT ord, slug, name, abbreviation, testament, deuterocanonical, chapter_count FROM books WHERE translation = ? ORDER BY ord", translation);
  return {
    translation: { code: translation, name: corpus.title },
    books: rows.map(toBookDto),
  };
}

/** A whole chapter from the device copy, or null when it is not downloaded. */
export async function readLocalChapter(translationCode: string, bookRef: string, chapter: number): Promise<ChapterDto | null> {
  const translation = translationCode.toUpperCase();
  const db = await openDatabase();
  const corpus = await db.getFirstAsync<{ title: string }>("SELECT title FROM corpora WHERE kind = 'bible' AND id = ?", translation);
  if (corpus === null) return null;
  const book = await findBook(translation, bookRef);
  if (book === null) return null;
  const rows = await db.getAllAsync<VerseRow>("SELECT book_ord, chapter, verse, text FROM verses WHERE translation = ? AND book_ord = ? AND chapter = ? ORDER BY verse", translation, book.ord, chapter);
  if (rows.length === 0) return null;
  return {
    translation: { code: translation, name: corpus.title },
    book: toBookDto(book),
    chapter,
    verses: rows.map((row) => toVerseDto(book, row)),
  };
}
