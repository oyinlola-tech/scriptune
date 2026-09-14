import { readFile } from "node:fs/promises";
import { ExternalServiceError } from "@zudojs/errors";
import type { ImportBookInput } from "../../modules/bible/commands/index.js";
import type { BibleSource } from "./bible.sources.js";
import { parseScrollmapperDataset } from "./scrollmapper.parser.js";
import { parseVplText, USFM_CODES } from "./vpl.parser.js";
import { readZipEntry } from "../../utils/zip/index.js";

export interface DatasetLocation {
  /** Local file used instead of downloading (JSON for scrollmapper, .txt or .zip for verse-per-line). */
  readonly file?: string;
  /** Overrides the pinned download URL. */
  readonly url?: string;
}

export interface LoadedDataset {
  readonly books: readonly ImportBookInput[];
  readonly skipped: readonly string[];
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok) {
    throw new ExternalServiceError(`Downloading ${url} failed with HTTP ${response.status}.`, { service: "download", metadata: { url } });
  }
  return Buffer.from(await response.arrayBuffer());
}

async function readBytes(location: DatasetLocation, fallbackUrl: string): Promise<Buffer> {
  return location.file === undefined ? download(location.url ?? fallbackUrl) : readFile(location.file);
}

function vplText(bytes: Buffer, entry: string | undefined, file: string | undefined): string {
  const isZip = bytes.length > 4 && bytes.readUInt32LE(0) === 0x04034b50;
  const text = isZip && entry !== undefined ? readZipEntry(bytes, entry) : bytes;
  if (isZip && entry === undefined) throw new ExternalServiceError(`No zip entry name is known for ${file ?? "the download"}.`, { service: "download" });
  return text.toString("utf8");
}

/** Downloads (or reads) a source and parses it into import input, filling gaps from supplements. */
export async function loadBibleSource(source: BibleSource, location: DatasetLocation = {}): Promise<LoadedDataset> {
  const bytes = await readBytes(location, source.url);
  if (source.format === "scrollmapper") {
    const text = bytes.toString("utf8").replace(/^﻿/, "");
    return parseScrollmapperDataset(JSON.parse(text) as unknown, source.canon);
  }
  const parsed = parseVplText(vplText(bytes, source.entry, location.file), source.canon);
  const books = [...parsed.books];
  if (location.file === undefined) {
    for (const supplement of source.supplements ?? []) {
      const extra = parseVplText(vplText(await download(supplement.url), supplement.entry, undefined), source.canon);
      const wanted = new Set(supplement.codes);
      for (const book of extra.books) {
        if (!books.some((existing) => existing.order === book.order) && codeForOrder(book.order, wanted)) books.push(book);
      }
    }
  }
  books.sort((a, b) => a.order - b.order);
  return { books, skipped: parsed.skipped };
}

function codeForOrder(order: number, wanted: ReadonlySet<string>): boolean {
  const code = USFM_CODES[order - 1];
  return code !== undefined && wanted.has(code);
}
