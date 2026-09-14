import { badRequest, getMultipartBoundary, parseMultipartFormData, type HttpRequestContext, type HTTPFormData } from "@zudojs/http";

const JSON_CONTENT_TYPE = /^application\/json\b/i;

function bodyBytes(request: HttpRequestContext): Buffer | undefined {
  const { body } = request;
  if (body instanceof Uint8Array) {
    return Buffer.isBuffer(body) ? body : Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }
  return undefined;
}

/** Whether the request carried any body bytes at all. */
export function hasBody(request: HttpRequestContext): boolean {
  const bytes = bodyBytes(request);
  return bytes !== undefined && bytes.length > 0;
}

/** Decodes a JSON body, answering 400 for a missing, mistyped or malformed one. */
export function readJsonBody(request: HttpRequestContext): unknown {
  const contentType = request.getHeader("content-type") ?? "";
  if (!JSON_CONTENT_TYPE.test(contentType)) {
    throw badRequest("Expected a JSON body.", { code: "UNSUPPORTED_MEDIA_TYPE" });
  }
  const bytes = bodyBytes(request);
  if (bytes === undefined || bytes.length === 0) {
    throw badRequest("The request body is empty.", { code: "EMPTY_BODY" });
  }
  try {
    return JSON.parse(bytes.toString("utf8")) as unknown;
  } catch {
    throw badRequest("The request body is not valid JSON.", { code: "INVALID_JSON" });
  }
}

export interface MultipartLimits {
  readonly maxFileSize: number;
  readonly maxFiles?: number;
}

/** Parses a multipart form body, answering 400 when it is not multipart. */
export function readMultipartBody(request: HttpRequestContext, limits: MultipartLimits): HTTPFormData {
  const contentType = request.getHeader("content-type");
  const boundary = getMultipartBoundary(contentType);
  if (boundary === undefined) {
    throw badRequest("Expected a multipart/form-data body.", { code: "UNSUPPORTED_MEDIA_TYPE" });
  }
  const bytes = bodyBytes(request);
  if (bytes === undefined || bytes.length === 0) {
    throw badRequest("The request body is empty.", { code: "EMPTY_BODY" });
  }
  return parseMultipartFormData(bytes, boundary, { maxFileSize: limits.maxFileSize, maxFiles: limits.maxFiles ?? 1 });
}
