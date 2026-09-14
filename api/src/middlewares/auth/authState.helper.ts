import { unauthorized, type HttpRequestContext } from "@zudojs/http";

export const AUTH_STATE_KEY: unique symbol = Symbol.for("scriptune.auth");

/** Who is making the request, once a bearer token has been verified. */
export interface AuthState {
  readonly userId: string;
  readonly sessionId: string | null;
  readonly roles: readonly string[];
  readonly tokenId: string;
}

export function getAuthState(request: HttpRequestContext): AuthState | undefined {
  return request.getState<AuthState>(AUTH_STATE_KEY);
}

export function requireAuthState(request: HttpRequestContext): AuthState {
  const state = getAuthState(request);
  if (state === undefined) {
    throw unauthorized("Sign in to continue.", { code: "AUTHENTICATION_REQUIRED" });
  }
  return state;
}
