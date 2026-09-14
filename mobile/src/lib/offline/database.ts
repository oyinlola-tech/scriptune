import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "scriptune.db";
const SCHEMA_VERSION = 3;

let opening: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS corpora (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    item_count INTEGER NOT NULL,
    rights_status TEXT NOT NULL DEFAULT 'public-domain',
    generated_at TEXT NOT NULL,
    downloaded_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS books (
    translation TEXT NOT NULL,
    ord INTEGER NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    testament TEXT NOT NULL,
    deuterocanonical INTEGER NOT NULL DEFAULT 0,
    chapter_count INTEGER NOT NULL,
    PRIMARY KEY (translation, ord)
  );
  CREATE INDEX IF NOT EXISTS books_slug ON books (translation, slug);
  CREATE TABLE IF NOT EXISTS verses (
    translation TEXT NOT NULL,
    book_ord INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (translation, book_ord, chapter, verse)
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5 (
    translation UNINDEXED, book_ord UNINDEXED, chapter UNINDEXED, verse UNINDEXED, text, tokenize = 'porter unicode61'
  );
  CREATE TABLE IF NOT EXISTS hymns (
    hymnal TEXT NOT NULL,
    number INTEGER NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    first_line TEXT NOT NULL,
    stanzas TEXT NOT NULL,
    rights_status TEXT NOT NULL DEFAULT 'public-domain',
    PRIMARY KEY (hymnal, number)
  );
  CREATE INDEX IF NOT EXISTS hymns_slug ON hymns (slug);
  CREATE VIRTUAL TABLE IF NOT EXISTS hymns_fts USING fts5 (
    slug UNINDEXED, hymnal UNINDEXED, title, lyrics, tokenize = 'porter unicode61'
  );
`;

/**
 * The on-device copy of whatever corpora the person downloaded. Opened once;
 * the schema is idempotent so a fresh install and an upgrade take the same path.
 */
export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (opening === null) {
    opening = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const current = (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? 0;
      if (current !== 0 && current < SCHEMA_VERSION) {
        // Pre-release schema change: drop the downloaded copies; the person downloads again.
        await db.execAsync("DROP TABLE IF EXISTS verses_fts; DROP TABLE IF EXISTS hymns_fts; DROP TABLE IF EXISTS verses; DROP TABLE IF EXISTS books; DROP TABLE IF EXISTS hymns; DROP TABLE IF EXISTS corpora;");
      }
      await db.execAsync(SCHEMA);
      await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      return db;
    })();
  }
  return opening;
}

export interface CorpusRecord {
  id: string;
  kind: "bible" | "hymnal";
  title: string;
  item_count: number;
  rights_status: string;
  generated_at: string;
  downloaded_at: string;
}

/** What is on the device right now. */
export async function listCorpora(): Promise<CorpusRecord[]> {
  const db = await openDatabase();
  return db.getAllAsync<CorpusRecord>("SELECT * FROM corpora ORDER BY kind, title");
}

export async function hasCorpus(kind: CorpusRecord["kind"], id: string): Promise<boolean> {
  const db = await openDatabase();
  const row = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM corpora WHERE kind = ? AND id = ?", kind, id);
  return (row?.n ?? 0) > 0;
}
