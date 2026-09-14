import { createResponseContext, type HttpResponseContext } from "@zudojs/http";

/** Builds a JSON response with the given status. */
export function jsonResponse(body: unknown, status: number = 200): HttpResponseContext {
  return createResponseContext().setStatus(status).json(body);
}

/** A JSON response that proxies and clients may keep for `maxAgeSeconds`. */
export function cachedJsonResponse(body: unknown, maxAgeSeconds: number): HttpResponseContext {
  return createResponseContext().setStatus(200).setHeader("cache-control", `public, max-age=${maxAgeSeconds}`).json(body);
}

/** Framework-agnostic document response, as produced by the OpenAPI manager. */
export interface DocumentResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

/** Converts a pre-rendered document into a response context. */
export function fromDocumentResponse(document: DocumentResponse): HttpResponseContext {
  return createResponseContext({
    status: document.status,
    headers: document.headers,
    body: document.body,
  });
}
