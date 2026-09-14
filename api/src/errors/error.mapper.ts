import { isBaseError, type BaseError } from "@zudojs/errors";
import {
  createResponseContext,
  getStatusText,
  HttpError,
  REQUEST_ID_HEADER,
  type HttpResponseContext,
} from "@zudojs/http";

/** Body shape of every error response the API returns. */
export interface ErrorResponseBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly status: number;
    readonly requestId?: string;
    readonly details?: unknown;
  };
}

const MAX_CAUSE_DEPTH = 8;
const INTERNAL_CODE = "INTERNAL_ERROR";

function hasHttpStatus(error: BaseError): boolean {
  return Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600;
}

/**
 * Walks the cause chain and returns the first framework error carrying an
 * HTTP status. Middleware wrappers report 500, so the original error is
 * usually one level down.
 */
export function findResponsibleError(error: unknown): BaseError | undefined {
  let current: unknown = error;
  let fallback: BaseError | undefined;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Error; depth += 1) {
    if (isBaseError(current)) {
      if (hasHttpStatus(current) && current.statusCode !== 500) {
        return current;
      }
      fallback ??= current;
    }
    current = current.cause;
  }
  return fallback;
}

/** Resolves the HTTP status an error should be answered with. */
export function resolveErrorStatus(error: unknown): number {
  const responsible = findResponsibleError(error);
  return responsible !== undefined && hasHttpStatus(responsible) ? responsible.statusCode : 500;
}

/** Builds the JSON body for an error without leaking internals. */
export function toErrorBody(error: unknown, requestId?: string): ErrorResponseBody {
  const responsible = findResponsibleError(error);
  const status = resolveErrorStatus(error);
  const exposed = responsible !== undefined && responsible.expose && status < 500;
  const details =
    exposed && responsible instanceof HttpError && responsible.details !== undefined
      ? responsible.details
      : undefined;
  return {
    error: {
      code: exposed ? String(responsible.code) : status < 500 ? getStatusText(status).toUpperCase().replace(/\s+/g, "_") : INTERNAL_CODE,
      message: exposed ? responsible.message : getStatusText(status),
      status,
      ...(requestId === undefined ? {} : { requestId }),
      ...(details === undefined ? {} : { details }),
    },
  };
}

/** Converts any thrown value into a complete error response. */
export function toErrorResponse(error: unknown, requestId?: string): HttpResponseContext {
  const body = toErrorBody(error, requestId);
  const response = createResponseContext().setStatus(body.error.status).json(body);
  const responsible = findResponsibleError(error);
  if (responsible instanceof HttpError) {
    for (const [name, value] of Object.entries(responsible.headers)) {
      response.header(name, value);
    }
  }
  if (requestId !== undefined) {
    response.header(REQUEST_ID_HEADER, requestId);
  }
  return response;
}
