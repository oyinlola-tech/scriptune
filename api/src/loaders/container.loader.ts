import type { Container } from "@zudojs/container";
import { createCommandBus, createQueryBus } from "@zudojs/cqrs";
import { createEventBus } from "@zudojs/events";
import type { Logger } from "@zudojs/logger";
import type { AppConfig } from "../configs/index.js";
import { TOKENS } from "../constants/index.js";
import { HealthRegistry } from "../services/index.js";

/** Registers the services every module may depend on. */
export function registerCoreServices(container: Container, config: AppConfig, logger: Logger): void {
  container.registerValue(TOKENS.appConfig, config);
  container.registerValue(TOKENS.logger, logger);
  container.registerValue(TOKENS.eventBus, createEventBus());
  container.registerValue(TOKENS.commandBus, createCommandBus());
  container.registerValue(TOKENS.queryBus, createQueryBus());
  container.registerValue(TOKENS.healthRegistry, new HealthRegistry());
}
