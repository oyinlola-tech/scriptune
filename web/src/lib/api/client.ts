import { ApiError, type TokenSource } from "@scriptune/contracts";
import type { ApiErrorBody, TokensDto } from "./types";

export { ApiError, type TokenSource };

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

let tokenSource: TokenSource | null = null;

/** The auth store registers itself here so the client can attach and refresh tokens. */
export function setTokenSource(source: TokenSource | null): void {
  tokenSource = source;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the bearer token when signed in (default true). */
  auth?: boolean;
  signal?: AbortSignal;
  /** Next.js fetch cache hints for server components. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody["error"] | undefined;
  try {
    body = ((await response.json()) as ApiErrorBody).error;
  } catch {
    body = undefined;
  }
  return new ApiError(response.status, body);
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

/** Calls the API, adding the bearer token and retrying once after a refresh on 401. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const attempt = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { accept: "application/json" };
    if (options.body !== undefined && !isFormData(options.body)) {
      headers["content-type"] = "application/json";
    }
    if (token !== null) {
      headers.authorization = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : isFormData(options.body) ? options.body : JSON.stringify(options.body),
      signal: options.signal,
      next: options.next,
      cache: options.cache,
    });
  };

  const useAuth = options.auth ?? true;
  const initialToken = useAuth ? (tokenSource?.getAccessToken() ?? null) : null;
  let response = await attempt(initialToken);
  if (response.status === 401 && useAuth && tokenSource !== null) {
    const refreshed = await tokenSource.refresh();
    if (refreshed !== null) {
      response = await attempt(refreshed);
    }
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Refreshes tokens without going through the token source (used by the store itself). */
export async function refreshTokens(refreshToken: string): Promise<TokensDto | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (response.ok) {
    return ((await response.json()) as { tokens: TokensDto }).tokens;
  }
  // 401/403 mean the token is genuinely gone (expired, reused, revoked): sign out.
  // Anything else (429, 5xx, offline) is transient: throw so the caller keeps the token and can retry.
  if (response.status === 401 || response.status === 403) {
    return null;
  }
  throw await parseError(response);
}
