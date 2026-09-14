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
    // A hop count. @zudojs/http types accept a number but its compiler trusts nothing for one;
    // it does honour a predicate, so the count becomes "hops closer to the peer than n".
    trustProxy: config.trustProxy > 0 ? ((((_address: string, hop: number) => hop < config.trustProxy) as unknown) as boolean) : false,
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
