import type { Runtime } from "@zudojs/runtime";
import { createApp } from "../../src/app.js";
import type { EnvironmentMap } from "../../src/configs/index.js";
import { TOKENS } from "../../src/constants/index.js";
import { HttpModule } from "../../src/modules/http/index.js";

/** Environment that boots the API on an ephemeral port with logging off. */
export const TEST_ENV: EnvironmentMap = Object.freeze({
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: "0",
  PUBLIC_URL: "http://127.0.0.1",
  LOG_LEVEL: "fatal",
  DATABASE_URL: "postgresql://scriptune:scriptune@localhost:5432/scriptune_test",
  WEB_ORIGIN: "http://localhost:3000,https://scriptune.app",
  AUTH_ACCESS_SECRET: "test-access-secret-that-is-long-enough-0123456789",
  AUTH_REFRESH_SECRET: "test-refresh-secret-that-is-long-enough-987654321",
});

export interface RunningApp {
  readonly runtime: Runtime;
  readonly baseUrl: string;
  stop(): Promise<void>;
}

/** Boots only the http module, so no database is needed. */
export async function startHttpApp(env: EnvironmentMap = TEST_ENV): Promise<RunningApp> {
  const runtime = await createApp({
    env,
    modules: (container) => new Map([["http", new HttpModule(container)]]),
  });
  await runtime.start();
  const server = runtime.context.container.resolve(TOKENS.httpServer);
  const port = server.address?.port;
  if (port === undefined) {
    await runtime.stop();
    throw new Error("HTTP server did not report a port.");
  }
  return {
    runtime,
    baseUrl: `http://127.0.0.1:${port}`,
    stop: () => runtime.stop(),
  };
}
