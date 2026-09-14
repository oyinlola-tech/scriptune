import type { DatabaseLogger } from "@zudojs/database";
import type { Logger } from "@zudojs/logger";
import { toLogMetadata, toLogValue } from "../loggers/log.helper.js";

/** Adapts the application logger to the database package's logger contract. */
export function toDatabaseLogger(logger: Logger): DatabaseLogger {
  return {
    debug: (message, metadata) => logger.debug(message, toLogMetadata(metadata)),
    info: (message, metadata) => logger.info(message, toLogMetadata(metadata)),
    warn: (message, metadata) => logger.warn(message, toLogMetadata(metadata)),
    error: (message, error, metadata) =>
      logger.error(message, { ...toLogMetadata(metadata), error: toLogValue(error) }),
  };
}
