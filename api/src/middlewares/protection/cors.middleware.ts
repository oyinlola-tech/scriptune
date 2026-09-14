import { createCorsMiddleware, type HttpMiddleware } from "@zudojs/http";
import type { AppConfig } from "../../configs/index.js";

/**
 * Allows only the configured web origins. Credentials stay off because the
 * web app authenticates with bearer tokens, not cookies.
 */
export function createAppCorsMiddleware(config: AppConfig): HttpMiddleware {
  return createCorsMiddleware({
    allowOrigin: config.webOrigins,
    allowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowHeaders: "Content-Type,Authorization,X-Request-Id",
    exposeHeaders: "X-Request-Id,RateLimit-Limit,RateLimit-Remaining,RateLimit-Reset",
    credentials: false,
    maxAge: 600,
  });
}
