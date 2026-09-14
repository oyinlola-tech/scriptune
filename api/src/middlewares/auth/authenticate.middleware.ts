import { parseBearerToken, type AuthService } from "@zudojs/auth";
import { unauthorized, type HttpMiddleware } from "@zudojs/http";
import { AUTH_STATE_KEY, requireAuthState, type AuthState } from "./authState.helper.js";

/**
 * Verifies a bearer token when one is present and records who the caller
 * is. Requests without a token pass through anonymously; a bad token is a
 * 401 so clients learn their session is gone.
 */
export function createAuthenticateMiddleware(authService: AuthService): HttpMiddleware {
  return async (context, next) => {
    const token = parseBearerToken(context.request.getHeader("authorization"));
    if (token === null) {
      return next();
    }
    const payload = await authService.verifyToken(token);
    if (payload.typ !== "access") {
      throw unauthorized("Use an access token, not a refresh token.", { code: "WRONG_TOKEN_TYPE" });
    }
    const state: AuthState = {
      userId: payload.sub,
      sessionId: payload.sid ?? null,
      roles: payload.roles ?? [],
      tokenId: payload.jti,
    };
    context.request.setState(AUTH_STATE_KEY, state);
    return next();
  };
}

/** Rejects anonymous requests. Place after the authenticate middleware. */
export function createRequireAuthMiddleware(): HttpMiddleware {
  return async (context, next) => {
    requireAuthState(context.request);
    return next();
  };
}
