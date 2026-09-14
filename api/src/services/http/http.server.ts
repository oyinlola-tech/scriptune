import {
  createHttpServer,
  createNodeHttpAdapter,
  type HttpErrorHandler,
  type HttpHandler,
  type HttpServer,
} from "@zudojs/http";
import type { AppConfig } from "../../configs/index.js";
import {
  APP_NAME,
  MAX_REQUEST_BODY_BYTES,
  SHUTDOWN_TIMEOUT_MS,
} from "../../constants/app.constants.js";

export interface AppHttpServerOptions {
  readonly config: AppConfig;
  readonly handler: HttpHandler;
  readonly errorHandler: HttpErrorHandler;
}

/** Creates the Node HTTP server from configuration. Adapter settings live on the adapter. */
export function createAppHttpServer(options: AppHttpServerOptions): HttpServer {
  const { config, handler, errorHandler } = options;
  const adapter = createNodeHttpAdapter({
    host: config.host,
    port: config.port,
    trustProxy: config.trustProxy > 0 ? config.trustProxy : false,
    maxBodySize: MAX_REQUEST_BODY_BYTES,
    shutdownGraceMs: SHUTDOWN_TIMEOUT_MS,
  });
  return createHttpServer({
    name: APP_NAME,
    adapter,
    handler,
    errorHandler,
    gracefulShutdownTimeout: SHUTDOWN_TIMEOUT_MS,
  });
}
