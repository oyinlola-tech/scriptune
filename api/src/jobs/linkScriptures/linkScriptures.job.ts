import { createApp } from "../../app.js";
import type { EnvironmentMap } from "../../configs/index.js";
import { TOKENS } from "../../constants/index.js";
import { loadHeadlessModules } from "../../loaders/index.js";
import { LinkScripturesCommand, type LinkScripturesResult } from "../../modules/hymns/commands/index.js";

export interface LinkScripturesJobOptions {
  readonly env?: EnvironmentMap;
}

/**
 * Boots a headless runtime, finds where the English hymns quote the King
 * James Version, stores the links and stops. Run it after importing hymns.
 */
export async function runLinkScripturesJob(options: LinkScripturesJobOptions = {}): Promise<LinkScripturesResult> {
  const runtime = await createApp({ ...(options.env === undefined ? {} : { env: options.env }), modules: loadHeadlessModules });
  await runtime.start();
  const logger = runtime.context.container.resolve(TOKENS.logger).child({ name: "link:scriptures" });
  try {
    logger.info("Comparing hymns with scripture");
    const result = await runtime.context.container.resolve(TOKENS.commandBus).execute<LinkScripturesCommand, LinkScripturesResult>(new LinkScripturesCommand());
    logger.info("Linking complete", { ...result });
    return result;
  } finally {
    await runtime.stop();
  }
}
