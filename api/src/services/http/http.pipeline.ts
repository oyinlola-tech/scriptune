import { HttpMiddlewarePipeline, type HttpRouter } from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import type { AppConfig } from "../../configs/index.js";
import { logRequestError } from "../../errors/error.logger.js";
import { toErrorResponse } from "../../errors/error.mapper.js";
import {
  createAppCorsMiddleware,
  createRateLimitMiddleware,
  createAppSecurityMiddleware,
  createErrorBoundaryMiddleware,
  createRequestIdMiddleware,
  createRouterMiddleware,
  getRequestId,
} from "../../middlewares/index.js";

export interface AppPipelineOptions {
  readonly config: AppConfig;
  readonly router: HttpRouter;
  readonly logger: Logger;
}

/** The assembled middleware chain plus the hook that releases its timers. */
export interface AppPipeline {
  readonly pipeline: HttpMiddlewarePipeline;
  dispose(): void;
}

/**
 * Builds the global middleware chain. Lower priority runs first (outermost):
 *
 * requestId → security headers → CORS → rate limit → error boundary → router
 */
export function createAppPipeline(options: AppPipelineOptions): AppPipeline {
  const { config, router, logger } = options;
  const rateLimit = createRateLimitMiddleware(config.rateLimit);
  const pipeline = new HttpMiddlewarePipeline({
    onError: (error, context) => {
      const requestId = getRequestId(context.request);
      logRequestError(logger, error, context.request, requestId);
      return toErrorResponse(error, requestId);
    },
  });

  pipeline.use(createRequestIdMiddleware(), { name: "requestId", priority: 10 });
  pipeline.use(createAppSecurityMiddleware(config), { name: "securityHeaders", priority: 20 });
  pipeline.use(createAppCorsMiddleware(config), { name: "cors", priority: 30 });
  pipeline.use(rateLimit.middleware, { name: "rateLimit", priority: 40 });
  pipeline.use(createErrorBoundaryMiddleware(logger), { name: "errorBoundary", priority: 90 });
  pipeline.use(createRouterMiddleware(router), { name: "router", priority: 100 });

  return {
    pipeline,
    dispose: () => {
      rateLimit.dispose();
    },
  };
}
