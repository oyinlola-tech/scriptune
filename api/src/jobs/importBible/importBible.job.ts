import { NotFoundError } from "@zudojs/errors";
import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import { ImportTranslationCommand, type ImportTranslationResult } from "../../modules/bible/commands/index.js";
import { loadBibleSource, type DatasetLocation } from "./bible.loader.js";
import { BIBLE_SOURCES, findBibleSource } from "./bible.sources.js";

export interface ImportBibleJobOptions extends DatasetLocation {
  readonly env?: EnvironmentMap;
  /** Translation code to import (default KJV). Ignored when `all` is set. */
  readonly translation?: string;
  /** Imports every known translation in turn. */
  readonly all?: boolean;
}

/**
 * Boots a headless runtime (database + bible), imports one translation or
 * all of them, and stops. Datasets are downloaded from their pinned URLs
 * unless a file is given.
 */
export async function runImportBibleJob(options: ImportBibleJobOptions = {}): Promise<readonly ImportTranslationResult[]> {
  const sources = options.all === true ? BIBLE_SOURCES : [findBibleSource(options.translation ?? "KJV")].filter((source) => source !== undefined);
  if (sources.length === 0) {
    throw new NotFoundError(`Unknown translation "${options.translation}". Known: ${BIBLE_SOURCES.map((source) => source.code).join(", ")}.`);
  }
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "import:bible" });
  const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
  const results: ImportTranslationResult[] = [];
  try {
    for (const source of sources) {
      logger.info("Loading dataset", { translation: source.code, file: options.file, url: options.url ?? source.url });
      const { books, skipped } = await loadBibleSource(source, options.all === true ? {} : options);
      if (skipped.length > 0) logger.info("Skipped books outside the canon", { translation: source.code, skipped: skipped.join(", ") });
      logger.info("Importing verses", { translation: source.code, books: books.length });
      const result = await commandBus.execute<ImportTranslationCommand, ImportTranslationResult>(new ImportTranslationCommand({ translation: source.translation, books }));
      logger.info("Import complete", { ...result });
      results.push(result);
    }
    return results;
  } finally {
    await runtime.stop();
  }
}
