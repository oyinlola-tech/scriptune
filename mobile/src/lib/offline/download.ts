import type { BibleExportDto, HymnalExportDto } from "@scriptune/contracts";
import { api } from "../api";
import { openDatabase } from "./database";

export type DownloadProgress = { phase: "fetching" } | { phase: "storing"; done: number; total: number } | { phase: "done" };
type OnProgress = (progress: DownloadProgress) => void;

const BATCH = 500;

/** Downloads a translation and stores it, replacing any earlier copy. */
export async function downloadTranslation(code: string, onProgress: OnProgress = () => undefined): Promise<void> {
  onProgress({ phase: "fetching" });
  const dump = await api<BibleExportDto>(`/export/bible/${code.toLowerCase()}`, { auth: false });
  const translation = dump.translation.code;
  const db = await openDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM verses WHERE translation = ?", translation);
    await tx.runAsync("DELETE FROM verses_fts WHERE translation = ?", translation);
    await tx.runAsync("DELETE FROM books WHERE translation = ?", translation);
    const bookInsert = await tx.prepareAsync("INSERT INTO books (translation, ord, slug, name, local_name, abbreviation, testament, deuterocanonical, chapter_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    try {
      for (const book of dump.books) await bookInsert.executeAsync(translation, book.order, book.slug, book.name, book.localName ?? null, book.abbreviation, book.testament, book.deuterocanonical ? 1 : 0, book.chapterCount);
    } finally {
      await bookInsert.finalizeAsync();
    }
    const verseInsert = await tx.prepareAsync("INSERT INTO verses (translation, book_ord, chapter, verse, text) VALUES (?, ?, ?, ?, ?)");
    const ftsInsert = await tx.prepareAsync("INSERT INTO verses_fts (translation, book_ord, chapter, verse, text) VALUES (?, ?, ?, ?, ?)");
    try {
      for (let index = 0; index < dump.verses.length; index += 1) {
        const [bookOrder, chapter, verse, text] = dump.verses[index]!;
        await verseInsert.executeAsync(translation, bookOrder, chapter, verse, text);
        await ftsInsert.executeAsync(translation, bookOrder, chapter, verse, text);
        if (index % BATCH === 0) onProgress({ phase: "storing", done: index, total: dump.verses.length });
      }
    } finally {
      await verseInsert.finalizeAsync();
      await ftsInsert.finalizeAsync();
    }
    await tx.runAsync(
      "INSERT OR REPLACE INTO corpora (id, kind, title, item_count, rights_status, language, notice, generated_at, downloaded_at) VALUES (?, 'bible', ?, ?, ?, ?, ?, ?, ?)",
      translation, dump.translation.name, dump.verseCount, dump.translation.rightsStatus, dump.translation.language ?? "en", dump.translation.notice ?? null, dump.generatedAt, new Date().toISOString(),
    );
  });
  onProgress({ phase: "done" });
}

/** Downloads a hymnal with all its words and stores it, replacing any earlier copy. */
export async function downloadHymnal(slug: string, onProgress: OnProgress = () => undefined): Promise<void> {
  onProgress({ phase: "fetching" });
  const dump = await api<HymnalExportDto>(`/export/hymnals/${slug}`, { auth: false });
  const hymnal = dump.hymnal.slug;
  const db = await openDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM hymns_fts WHERE hymnal = ?", hymnal);
    await tx.runAsync("DELETE FROM hymns WHERE hymnal = ?", hymnal);
    const insert = await tx.prepareAsync("INSERT INTO hymns (hymnal, number, slug, title, language, first_line, stanzas, rights_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const fts = await tx.prepareAsync("INSERT INTO hymns_fts (slug, hymnal, title, lyrics) VALUES (?, ?, ?, ?)");
    try {
      for (let index = 0; index < dump.hymns.length; index += 1) {
        const hymn = dump.hymns[index]!;
        await insert.executeAsync(hymnal, hymn.number, hymn.slug, hymn.title, hymn.language, hymn.firstLine, JSON.stringify(hymn.stanzas), dump.hymnal.rightsStatus);
        await fts.executeAsync(hymn.slug, hymnal, hymn.title, hymn.stanzas.map((stanza) => stanza.lines.join(" ")).join(" "));
        if (index % 100 === 0) onProgress({ phase: "storing", done: index, total: dump.hymns.length });
      }
    } finally {
      await insert.finalizeAsync();
      await fts.finalizeAsync();
    }
    await tx.runAsync(
      "INSERT OR REPLACE INTO corpora (id, kind, title, item_count, rights_status, generated_at, downloaded_at) VALUES (?, 'hymnal', ?, ?, ?, ?, ?)",
      hymnal, dump.hymnal.title, dump.hymnCount, dump.hymnal.rightsStatus, dump.generatedAt, new Date().toISOString(),
    );
  });
  onProgress({ phase: "done" });
}

/** Removes a corpus from the device. */
export async function removeCorpus(kind: "bible" | "hymnal", id: string): Promise<void> {
  const db = await openDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    if (kind === "bible") {
      await tx.runAsync("DELETE FROM verses WHERE translation = ?", id);
      await tx.runAsync("DELETE FROM verses_fts WHERE translation = ?", id);
      await tx.runAsync("DELETE FROM books WHERE translation = ?", id);
    } else {
      await tx.runAsync("DELETE FROM hymns_fts WHERE hymnal = ?", id);
      await tx.runAsync("DELETE FROM hymns WHERE hymnal = ?", id);
    }
    await tx.runAsync("DELETE FROM corpora WHERE kind = ? AND id = ?", kind, id);
  });
}
