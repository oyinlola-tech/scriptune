import type { ApiErrorBody, TokensDto } from "./types";

/** An API failure with the server's error code and message. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody["error"] | undefined) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.details = body?.details;
    this.requestId = body?.requestId;
  }
}

/** Where the client finds the current access token and how it refreshes it. */
export interface TokenSource {
  getAccessToken(): string | null;
  /** Refreshes tokens; returns the new access token or null when signed out. */
  refresh(): Promise<string | null>;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the bearer token when signed in (default true). */
  auth?: boolean;
  signal?: AbortSignal;
  /** Extra fetch fields a platform wants to pass through (Next.js cache hints, for example). */
  extra?: Record<string, unknown>;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  tokenSource?: TokenSource | null;
}

/** A request function bound to a base URL and token source. */
export type ApiRequest = <T>(path: string, options?: RequestOptions) => Promise<T>;

export interface ApiClient {
  request: ApiRequest;
  refreshTokens(refreshToken: string): Promise<TokensDto | null>;
  setTokenSource(source: TokenSource | null): void;
  /** Points the client at another server, for example a tunnel address chosen on the device. */
  setBaseUrl(url: string): void;
  getBaseUrl(): string;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
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

/**
 * Creates a client that adds the bearer token, retries once after a refresh
 * on 401, and throws ApiError for non-2xx responses. Works in browsers,
 * Node, and React Native.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  let baseUrl = options.baseUrl.replace(/\/$/, "");
  const doFetch = options.fetch ?? fetch;
  let tokenSource = options.tokenSource ?? null;
  // Only one refresh runs at a time: refresh tokens are single-use, so parallel
  // 401s (a screen firing several queries at once) must share one rotation
  // instead of each replaying the token and getting the whole session revoked.
  let refreshing: Promise<string | null> | null = null;
  const refreshOnce = (): Promise<string | null> => {
    if (tokenSource === null) return Promise.resolve(null);
    if (refreshing === null) {
      const source = tokenSource;
      refreshing = source.refresh().finally(() => { refreshing = null; });
    }
    return refreshing;
  };

  const request: ApiRequest = async <T>(path: string, requestOptions: RequestOptions = {}): Promise<T> => {
    const { extra } = requestOptions;
    const extraHeaders = extra !== undefined && typeof extra === "object" && "headers" in extra ? (extra as { headers?: Record<string, string> }).headers : undefined;
    const attempt = (token: string | null): Promise<Response> => {
      const headers: Record<string, string> = { accept: "application/json", ...extraHeaders };
      const body = requestOptions.body;
      if (body !== undefined && !isFormData(body)) headers["content-type"] = "application/json";
      if (token !== null) headers.authorization = `Bearer ${token}`;
      return doFetch(`${baseUrl}${path}`, {
        ...extra,
        method: requestOptions.method ?? "GET",
        headers,
        body: body === undefined ? undefined : isFormData(body) ? body : JSON.stringify(body),
        signal: requestOptions.signal,
      });
    };

    const useAuth = requestOptions.auth ?? true;
    let response = await attempt(useAuth ? (tokenSource?.getAccessToken() ?? null) : null);
    if (response.status === 401 && useAuth && tokenSource !== null) {
      const refreshed = await refreshOnce();
      if (refreshed !== null) response = await attempt(refreshed);
    }
    if (!response.ok) throw await parseError(response);
    if (response.status === 204 || response.headers.get("content-length") === "0") return undefined as T;
    const text = await response.text();
    return (text === "" ? undefined : JSON.parse(text)) as T;
  };

  return {
    request,
    setTokenSource(source) {
      tokenSource = source;
    },
    setBaseUrl(url) {
      baseUrl = url.replace(/\/$/, "");
    },
    getBaseUrl() {
      return baseUrl;
    },
    async refreshTokens(refreshToken) {
      const response = await doFetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (response.ok) return ((await response.json()) as { tokens: TokensDto }).tokens;
      // 401/403: the token is genuinely gone, sign out. Anything else is transient; throw so the caller keeps it.
      if (response.status === 401 || response.status === 403) return null;
      throw await parseError(response);
    },
  };
}
