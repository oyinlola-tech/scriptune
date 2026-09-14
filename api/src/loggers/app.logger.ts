import {
  createDevelopmentLoggerFormatter,
  createLogger,
  createProductionLoggerFormatter,
  loggerLevelFromName,
  type Logger,
} from "@zudojs/logger";
import type { AppConfig } from "../configs/index.js";
import { APP_NAME } from "../constants/app.constants.js";
import { createLineTransport } from "./line.transport.js";

/**
 * Creates the root application logger.
 *
 * Production and staging emit JSON lines; other environments emit readable
 * text. Secret-looking fields are redacted by the framework by default.
 */
export function createAppLogger(config: AppConfig): Logger {
  const structured = config.environment === "production" || config.environment === "staging";
  return createLogger({
    name: APP_NAME,
    level: loggerLevelFromName(config.logLevel),
    environment: config.environment,
    formatter: structured ? createProductionLoggerFormatter() : createDevelopmentLoggerFormatter(),
    transports: [createLineTransport()],
  });
}
