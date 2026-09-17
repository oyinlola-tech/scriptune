import { readFile } from "node:fs/promises";
import { ExternalServiceError } from "@zudojs/errors";
import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { CROSS_REFERENCE_MAX_PER_VERSE, TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import { ImportCrossReferencesCommand, type ImportCrossReferencesResult } from "../../modules/bible/commands/index.js";
import { readZipEntry } from "../../utils/zip/index.js";
import { parseOpenBibleCrossReferences } from "./openbible.parser.js";

/** OpenBible.info's cross-references, CC BY 4.0. The archive is regenerated as readers vote. */
export const CROSS_REFERENCES_URL = "https://a.openbible.info/data/cross-references.zip";
const ENTRY = "cross_references.txt";

export interface ImportCrossReferencesJobOptions {
  readonly file?: string;
  readonly url?: string;
  readonly env?: EnvironmentMap;
}

async function loadDataset(options: ImportCrossReferencesJobOptions): Promise<string> {
  let bytes: Buffer;
  if (options.file !== undefined) {
    bytes = await readFile(options.file);
  } else {
    const url = options.url ?? CROSS_REFERENCES_URL;
    const response = await fetch(url, { signal: AbortSignal.timeout(180_000) });
    if (!response.ok) throw new ExternalServiceError(`Downloading ${url} failed with HTTP ${response.status}.`, { service: "download", metadata: { url } });
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const isZip = bytes.length > 4 && bytes.readUInt32LE(0) === 0x04034b50;
  return (isZip ? readZipEntry(bytes, ENTRY) : bytes).toString("utf8");
}

/** Boots a headless runtime, replaces the cross-references and stops. */
export async function runImportCrossReferencesJob(options: ImportCrossReferencesJobOptions = {}): Promise<ImportCrossReferencesResult> {
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "import:cross-references" });
  try {
    logger.info("Loading cross-references", { file: options.file, url: options.url ?? CROSS_REFERENCES_URL });
    const rows = parseOpenBibleCrossReferences(await loadDataset(options), { minVotes: 1, perVerse: CROSS_REFERENCE_MAX_PER_VERSE });
    logger.info("Importing cross-references", { links: rows.length });
    const result = await runtime.context.container.resolve(TOKENS.commandBus).execute<ImportCrossReferencesCommand, ImportCrossReferencesResult>(new ImportCrossReferencesCommand(rows));
    logger.info("Import complete", { ...result });
    return result;
  } finally {
    await runtime.stop();
  }
}
