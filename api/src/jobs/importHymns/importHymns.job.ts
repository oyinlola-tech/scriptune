import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import {
  ImportHymnalCommand,
  type ImportHymnalResult,
  type ImportHymnEntryInput,
} from "../../modules/hymns/commands/index.js";
import { cleanTitle, splitStanzas } from "./sss.cleaner.js";
import { parseSssDart, type RawSssHymn } from "./sss.parser.js";
import { loadSssDataset, SSS_HYMN_COUNT, SSS_HYMNAL, SSS_SOURCE, type SssDatasetLocation } from "./sss.source.js";

export interface ImportHymnsJobOptions extends SssDatasetLocation {
  readonly env?: EnvironmentMap;
}

/** Converts parsed dataset entries into import input, dropping the modern anthems. */
export function toImportEntries(hymns: readonly RawSssHymn[]): readonly ImportHymnEntryInput[] {
  return hymns
    .filter((hymn) => hymn.number >= 1 && hymn.number <= SSS_HYMN_COUNT)
    .map((hymn) => ({
      number: hymn.number,
      title: cleanTitle(hymn.title),
      language: "en",
      stanzas: splitStanzas(hymn.lyric),
    }))
    .filter((entry) => entry.title !== "" && entry.stanzas.length > 0);
}

/** Boots a headless runtime, imports Sacred Songs and Solos and stops. */
export async function runImportHymnsJob(options: ImportHymnsJobOptions = {}): Promise<ImportHymnalResult> {
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "import:hymns" });
  try {
    logger.info("Loading Sacred Songs and Solos dataset", { file: options.file, url: options.url ?? SSS_SOURCE.url });
    const entries = toImportEntries(parseSssDart(await loadSssDataset(options)));
    logger.info("Importing hymns", { hymns: entries.length });
    const commandBus = runtime.context.container.resolve(TOKENS.commandBus);
    const result = await commandBus.execute<ImportHymnalCommand, ImportHymnalResult>(
      new ImportHymnalCommand({ source: SSS_SOURCE, hymnal: SSS_HYMNAL, entries }),
    );
    logger.info("Import complete", { ...result });
    return result;
  } finally {
    await runtime.stop();
  }
}
