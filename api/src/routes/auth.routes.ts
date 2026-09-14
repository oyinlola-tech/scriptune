import type { HttpMiddleware } from "@zudojs/http";
import type { AccountController, AuthController } from "../controllers/index.js";
import type { RouteSpec } from "../utils/http/route.helper.js";

export interface AuthRouteMiddleware {
  readonly rateLimit: HttpMiddleware;
  readonly authenticate: HttpMiddleware;
  readonly requireAuth: HttpMiddleware;
}

const TAGS = ["auth"];
const jsonBody = (properties: Record<string, unknown>, required: readonly string[]) => ({
  required: true,
  content: { "application/json": { schema: { type: "object", required: [...required], properties } } },
});
const sessionResponse = { "200": { description: "The user, a token pair and the session id." } };
const bearer = [{ bearerAuth: [] }];

/** Account and session endpoints. */
export function createAuthRoutes(controller: AuthController, account: AccountController, middleware: AuthRouteMiddleware): readonly RouteSpec[] {
  const { rateLimit, authenticate, requireAuth } = middleware;
  return [
    {
      method: "POST", path: "/auth/register", name: "auth.register", middleware: [rateLimit],
      handler: (context) => controller.register(context),
      openapi: {
        summary: "Create an account with email and password", tags: TAGS,
        requestBody: jsonBody({ email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 }, name: { type: "string" } }, ["email", "password"]),
        responses: { "201": { description: "Account created and signed in." }, "409": { description: "Email already registered." } },
      },
    },
    {
      method: "POST", path: "/auth/login", name: "auth.login", middleware: [rateLimit],
      handler: (context) => controller.login(context),
      openapi: {
        summary: "Sign in with email and password", tags: TAGS,
        requestBody: jsonBody({ email: { type: "string", format: "email" }, password: { type: "string" } }, ["email", "password"]),
        responses: { ...sessionResponse, "401": { description: "Wrong credentials." }, "423": { description: "Account temporarily locked." } },
      },
    },
    {
      method: "POST", path: "/auth/refresh", name: "auth.refresh", middleware: [rateLimit],
      handler: (context) => controller.refresh(context),
      openapi: {
        summary: "Rotate a refresh token", tags: TAGS,
        requestBody: jsonBody({ refreshToken: { type: "string" } }, ["refreshToken"]),
        responses: { "200": { description: "A new token pair." }, "401": { description: "Refresh token invalid, expired or reused." } },
      },
    },
    {
      method: "POST", path: "/auth/logout", name: "auth.logout", middleware: [authenticate, requireAuth],
      handler: (context) => controller.logout(context),
      openapi: { summary: "End the current session", tags: TAGS, security: bearer, responses: { "204": { description: "Signed out." }, "401": { description: "Not signed in." } } },
    },
    {
      method: "GET", path: "/auth/me", name: "auth.me", middleware: [authenticate, requireAuth],
      handler: (context) => controller.me(context),
      openapi: { summary: "Read the signed-in user", tags: TAGS, security: bearer, responses: { "200": { description: "The user." }, "401": { description: "Not signed in." } } },
    },
    {
      method: "DELETE", path: "/auth/me", name: "auth.deleteMe", middleware: [authenticate, requireAuth],
      handler: (context) => account.deleteMe(context),
      openapi: { summary: "Delete the signed-in user's account and all of their data", tags: TAGS, security: bearer, responses: { "204": { description: "Account deleted." }, "401": { description: "Not signed in." } } },
    },
    {
      method: "GET", path: "/auth/google", name: "auth.googleStart", middleware: [rateLimit],
      handler: (context) => controller.googleStart(context),
      openapi: {
        summary: "Start Google sign-in (redirects to Google)", tags: TAGS,
        parameters: [{ name: "redirect", in: "query", description: "Path on the web app to return to afterwards.", schema: { type: "string" } }],
        responses: { "302": { description: "Redirect to Google." }, "404": { description: "Google sign-in is not enabled." } },
      },
    },
    {
      method: "GET", path: "/auth/google/callback", name: "auth.googleCallback",
      handler: (context) => controller.googleCallback(context),
      openapi: { summary: "Google redirects here; the API then redirects to the web app with a one-time code", tags: TAGS, responses: { "302": { description: "Redirect to the web app callback." } } },
    },
    {
      method: "POST", path: "/auth/google/exchange", name: "auth.googleExchange", middleware: [rateLimit],
      handler: (context) => controller.googleExchange(context),
      openapi: {
        summary: "Trade the one-time code for tokens", tags: TAGS,
        requestBody: jsonBody({ code: { type: "string" } }, ["code"]),
        responses: { ...sessionResponse, "401": { description: "Code invalid or already used." } },
      },
    },
  ];
}
