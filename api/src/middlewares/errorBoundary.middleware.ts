import type { HttpMiddleware } from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import { logRequestError } from "../errors/error.logger.js";
import { toErrorResponse } from "../errors/error.mapper.js";
import { getRequestId } from "./requestId.middleware.js";

/**
 * Turns anything thrown by the router or a handler into an error response.
 *
 * Sits just outside the router so the outer middleware (request id, security
 * headers, CORS, rate limit headers) decorate error responses too.
 */
export function createErrorBoundaryMiddleware(logger: Logger): HttpMiddleware {
  return async (context, next) => {
    try {
      return await next();
    } catch (error) {
      const requestId = getRequestId(context.request);
      logRequestError(logger, error, context.request, requestId);
      return toErrorResponse(error, requestId);
    }
  };
}
