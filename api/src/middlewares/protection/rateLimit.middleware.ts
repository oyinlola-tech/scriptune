import { tooManyRequests, type HttpMiddleware } from "@zudojs/http";
import { createRateLimiter, retryAfterSeconds, type RateLimitResult } from "@zudojs/security";
import type { RateLimitConfig } from "../../configs/index.js";
import { toErrorResponse } from "../../errors/error.mapper.js";
import { getRequestId } from "../requestId.middleware.js";

/** A rate-limit middleware together with the hook that stops its timers. */
export interface RateLimitMiddleware {
  readonly middleware: HttpMiddleware;
  dispose(): void;
}

function limitHeaders(result: RateLimitResult): Readonly<Record<string, string>> {
  const resetSeconds = Math.max(0, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
  return {
    "ratelimit-limit": String(result.total),
    "ratelimit-remaining": String(result.remaining),
    "ratelimit-reset": String(resetSeconds),
  };
}

/**
 * Sliding-window limit per client IP. Used globally and, with tighter limits,
 * on expensive routes; the innermost (tightest) limiter's headers win.
 * Rejections are returned as responses rather than thrown so outer
 * middleware still runs.
 */
export function createRateLimitMiddleware(config: RateLimitConfig): RateLimitMiddleware {
  const limiter = createRateLimiter({
    max: config.max,
    windowMs: config.windowMs,
    keyGenerator: (request) => request.ip ?? "unknown",
  });

  const middleware: HttpMiddleware = async (context, next) => {
    const result = limiter.check({
      ...(context.request.remoteAddress === undefined ? {} : { ip: context.request.remoteAddress }),
      method: context.request.method,
      path: context.request.path,
    });
    if (!result.allowed) {
      const error = tooManyRequests("Too many requests. Try again shortly.", {
        headers: { "retry-after": String(retryAfterSeconds(result)), ...limitHeaders(result) },
      });
      return toErrorResponse(error, getRequestId(context.request));
    }
    const response = await next();
    if (response.headers["ratelimit-limit"] === undefined) {
      for (const [name, value] of Object.entries(limitHeaders(result))) {
        response.header(name, value);
      }
    }
    return response;
  };

  return {
    middleware,
    dispose: () => {
      limiter.destroy();
    },
  };
}
