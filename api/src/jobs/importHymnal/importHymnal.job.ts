import { readFile } from "node:fs/promises";
import { ValidationError } from "@zudojs/errors";
import { validate } from "@zudojs/validation";
import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import { ImportHymnalCommand, type ImportHymnalResult } from "../../modules/hymns/commands/index.js";
import { hymnalFileSchema, type HymnalFile } from "./hymnalFile.schema.js";

/** Reads and validates a hymnal JSON file. */
export async function loadHymnalFile(path: string): Promise<HymnalFile> {
  const contents = await readFile(path, "utf8");
  const result = validate(hymnalFileSchema, JSON.parse(contents.replace(/^﻿/, "")) as unknown);
  if (!result.success) {
    throw new ValidationError("The hymnal file does not have the expected shape.", {
      metadata: { issues: result.issues.slice(0, 5).map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`).join("; ") },
    });
  }
  return result.data;
}

export interface ImportHymnalJobOptions {
  readonly file: string;
  readonly env?: EnvironmentMap;
}

/**
 * Imports any hymnal from a JSON file (title, rights, and numbered hymns),
 * the path for collections used by permission such as a church's own hymnbook.
 * The file states its own rights status, which is stored on the hymnal, the
 * source and every hymn text.
 */
export async function runImportHymnalJob(options: ImportHymnalJobOptions): Promise<ImportHymnalResult> {
  const file = await loadHymnalFile(options.file);
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "import:hymnal" });
  try {
    logger.info("Importing hymnal", { slug: file.hymnal.slug, hymns: file.entries.length, rights: file.hymnal.rightsStatus });
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    const result = await commandBus.execute<ImportHymnalCommand, ImportHymnalResult>(
      new ImportHymnalCommand({
        source: { ...file.source, retrievedAt: new Date() },
        hymnal: file.hymnal,
        entries: file.entries.map((entry) => ({
          number: entry.number,
          title: entry.title,
          section: entry.section ?? null,
          rightsStatus: file.hymnal.rightsStatus,
          ...(entry.texts ? { texts: entry.texts } : { language: entry.language, stanzas: entry.stanzas ?? [] }),
        })),
      }),
    );
    logger.info("Import complete", { ...result });
    return result;
  } finally {
    await runtime.stop();
  }
}
