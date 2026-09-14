import { createSecurityMiddleware, type HttpMiddleware } from "@zudojs/http";
import type { AppConfig } from "../../configs/index.js";

const HSTS_TWO_YEARS = "max-age=63072000; includeSubDomains";

/**
 * Applies the framework's secure header defaults (nosniff, DENY framing,
 * strict referrer policy) and adds HSTS in production.
 */
export function createAppSecurityMiddleware(config: AppConfig): HttpMiddleware {
  return createSecurityMiddleware({
    referrerPolicy: "no-referrer",
    ...(config.environment === "production" ? { strictTransportSecurity: HSTS_TWO_YEARS } : {}),
  });
}
