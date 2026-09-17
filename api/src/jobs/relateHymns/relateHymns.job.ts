import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import { RelateHymnsCommand, type RelateHymnsResult } from "../../modules/hymns/commands/index.js";

export interface RelateHymnsJobOptions {
  readonly env?: EnvironmentMap;
}

/**
 * Boots a headless runtime, pairs each hymn with the hymns most like it and
 * stops. Run it after importing hymns, and after `link:scriptures` so that
 * shared scripture counts towards the pairing.
 */
export async function runRelateHymnsJob(options: RelateHymnsJobOptions = {}): Promise<RelateHymnsResult> {
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "link:hymns" });
  try {
    logger.info("Comparing hymns with one another");
    const result = await runtime.context.container.resolve(TOKENS.commandBus).execute<RelateHymnsCommand, RelateHymnsResult>(new RelateHymnsCommand());
    logger.info("Pairing complete", { ...result });
    return result;
  } finally {
    await runtime.stop();
  }
}
