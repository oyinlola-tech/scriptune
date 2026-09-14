import { ValidationError } from "@zudojs/errors";
import { validate, z } from "@zudojs/validation";
import { PROTESTANT_BOOK_COUNT } from "../../constants/bible.books.js";
import type { ImportBookInput } from "../../modules/bible/commands/index.js";
import { findCanonicalBook } from "../../utils/text/bibleBook.helper.js";

const datasetSchema = z.object({
  translation: z.string().optional(),
  books: z
    .array(
      z.object({
        name: z.string(),
        chapters: z.array(
          z.object({
            chapter: z.number().int().min(1).max(200),
            verses: z.array(z.object({ verse: z.number().int().min(1).max(200), text: z.string().max(10_000) })),
          }),
        ),
      }),
    )
    .min(1),
});

/** Removes editorial brackets the datasets leave around supplied words. */
export function cleanVerseText(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1").replace(/\s+/g, " ").trim();
}

export interface ScrollmapperParseResult {
  readonly books: readonly ImportBookInput[];
  /** Dataset book names that are not part of the requested canon (appendices, apocrypha). */
  readonly skipped: readonly string[];
}

/**
 * Converts the scrollmapper JSON layout into import input. Books are matched
 * by name, so Catholic orderings and appendices are handled: anything that is
 * not a known book, or is deuterocanonical when a Protestant canon was asked
 * for, is skipped and reported. Missing verse numbers leave empty slots that
 * the import ignores.
 */
export function parseScrollmapperDataset(data: unknown, canon: "protestant" | "catholic" = "protestant"): ScrollmapperParseResult {
  const result = validate(datasetSchema, data);
  if (!result.success) {
    throw new ValidationError("The dataset does not have the expected shape.", {
      metadata: { issues: result.issues.slice(0, 5).map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`).join("; ") },
    });
  }
  const books: ImportBookInput[] = [];
  const skipped: string[] = [];
  const seen = new Set<number>();
  for (const book of result.data.books) {
    const canonical = findCanonicalBook(book.name);
    if (canonical === undefined || (canon === "protestant" && canonical.order > PROTESTANT_BOOK_COUNT) || seen.has(canonical.order)) {
      skipped.push(book.name);
      continue;
    }
    seen.add(canonical.order);
    const chapters: string[][] = [];
    for (const chapter of book.chapters) {
      const verses: string[] = [];
      for (const verse of chapter.verses) verses[verse.verse - 1] = cleanVerseText(verse.text);
      chapters[chapter.chapter - 1] = Array.from(verses, (text) => text ?? "");
    }
    books.push({ order: canonical.order, chapters: Array.from(chapters, (chapter) => chapter ?? []) });
  }
  if (books.length === 0) {
    throw new ValidationError("The dataset contains no recognisable books.");
  }
  books.sort((a, b) => a.order - b.order);
  return { books, skipped };
}

/** The KJV import, kept for callers that predate multiple translations. */
export function parseKjvDataset(data: unknown): readonly ImportBookInput[] {
  return parseScrollmapperDataset(data, "protestant").books;
}
