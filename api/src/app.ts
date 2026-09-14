import { createContainer, type Container } from "@zudojs/container";
import type { Module } from "@zudojs/core";
import { createRuntime, type Runtime } from "@zudojs/runtime";
import { loadAppConfig, type EnvironmentMap } from "./configs/index.js";
import { APP_NAME, APP_VERSION, SHUTDOWN_TIMEOUT_MS, TOKENS } from "./constants/index.js";
import { loadModules, registerCoreServices } from "./loaders/index.js";
import { createAppLogger } from "./loggers/index.js";

export interface CreateAppOptions {
  /** Environment variables to read instead of `process.env`. */
  readonly env?: EnvironmentMap;
  /** Overrides the module set, mainly so tests can boot a subset. */
  readonly modules?: (container: Container) => ReadonlyMap<string, Module>;
}

/**
 * Assembles the application runtime.
 *
 * Order matters: configuration first, then the logger, then the container
 * with shared services, then the modules that consume them.
 */
export async function createApp(options: CreateAppOptions = {}): Promise<Runtime> {
  const config = await loadAppConfig(options.env);
  const logger = createAppLogger(config);
  const container = createContainer({ name: APP_NAME });
  registerCoreServices(container, config, logger);

  const modules = (options.modules ?? loadModules)(container);
  const runtime = createRuntime(
    { modules, logger, container, eventBus: container.resolve(TOKENS.eventBus) },
    {
      applicationName: APP_NAME,
      applicationVersion: APP_VERSION,
      environment: config.environment,
      shutdownTimeout: SHUTDOWN_TIMEOUT_MS,
      // Signals are handled explicitly in server.ts.
      handleSignals: false,
    },
  );

  runtime.registerReadinessCheck("modules", () => runtime.state === "running");

  return runtime;
}
