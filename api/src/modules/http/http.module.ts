import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { createResponseContext, type HttpServer } from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { SystemController } from "../../controllers/index.js";
import { logRequestError } from "../../errors/error.logger.js";
import { toErrorResponse } from "../../errors/error.mapper.js";
import { getRequestId } from "../../middlewares/requestId.middleware.js";
import { createDocsRoutes, createHealthRoutes } from "../../routes/index.js";
import { createAppOpenApi } from "../../services/openapi/openapi.factory.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import {
  createAppHttpServer,
  createAppPipeline,
  createAppRouter,
  type AppPipeline,
} from "../../services/http/index.js";
import { GET_HEALTH_REPORT, GetHealthReportHandler } from "./queries/index.js";

/**
 * Owns the HTTP server, router, middleware chain and system routes.
 *
 * Other modules depend on this one and register their routes on the shared
 * router during their own initialization. The server only starts in
 * `onReady`, after every module has initialized.
 */
export class HttpModule extends BaseModule {
  public readonly id = "http";
  public readonly name = "HTTP";

  private readonly container: Container;
  private readonly startedAt = Date.now();
  private chain: AppPipeline | undefined;
  private server: HttpServer | undefined;

  public constructor(container: Container) {
    super({ version: APP_VERSION });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const queryBus = this.container.resolve(TOKENS.queryBus);
    const health = this.container.resolve(TOKENS.healthRegistry);
    const logger = this.logger();

    queryBus.register(GET_HEALTH_REPORT, new GetHealthReportHandler(health));

    const router = createAppRouter();
    const openapi = createAppOpenApi(config);
    this.chain = createAppPipeline({ config, router, logger });
    this.container.registerValue(TOKENS.httpRouter, router);
    this.container.registerValue(TOKENS.openApi, openapi);
    this.container.registerValue(TOKENS.httpPipeline, this.chain.pipeline);

    const system = new SystemController({
      queryBus,
      environment: config.environment,
      startedAt: this.startedAt,
    });
    registerRoutes(router, openapi, [...createHealthRoutes(system), ...createDocsRoutes(openapi)]);
    logger.debug("HTTP router ready", { routes: router.count() });
  }

  public override async onReady(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const pipeline = this.container.resolve(TOKENS.httpPipeline);
    const logger = this.logger();

    const server = createAppHttpServer({
      config,
      handler: (request) => pipeline.execute(request, createResponseContext()),
      errorHandler: (error, request) => {
        const requestId = getRequestId(request);
        logRequestError(logger, error, request, requestId);
        return toErrorResponse(error, requestId);
      },
    });
    await server.start();
    this.server = server;
    this.container.registerValue(TOKENS.httpServer, server);
    logger.info("HTTP server listening", {
      host: server.address?.host,
      port: server.address?.port,
      docs: `${config.publicUrl}/docs`,
    });
  }

  public override async onShutdown(): Promise<void> {
    if (this.server !== undefined) {
      await this.server.stop();
      this.logger().info("HTTP server stopped");
      this.server = undefined;
    }
    this.chain?.dispose();
    this.chain = undefined;
  }

  private logger(): Logger {
    return this.container.resolve(TOKENS.logger).child({ name: "http" });
  }
}
