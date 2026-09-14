/**
 * Middleware that protects the API: CORS, security headers, rate limiting.
 *
 * @module middlewares/protection
 */
export * from "./cors.middleware.js";
export * from "./rateLimit.middleware.js";
export * from "./securityHeaders.middleware.js";
