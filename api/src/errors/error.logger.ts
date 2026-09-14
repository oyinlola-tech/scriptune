import type { HttpRequestContext } from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import { findResponsibleError, resolveErrorStatus } from "./error.mapper.js";

/** Structured description of an error for log output. */
export function describeError(error: unknown): Readonly<Record<string, unknown>> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }
  const responsible = findResponsibleError(error);
  return {
    name: responsible?.name ?? error.name,
    message: responsible?.message ?? error.message,
    ...(responsible === undefined ? {} : { code: responsible.code }),
    stack: (responsible ?? error).stack,
  };
}

/**
 * Logs a failed request at a severity that matches the outcome: server
 * failures are errors, client mistakes are warnings.
 */
export function logRequestError(
  logger: Logger,
  error: unknown,
  request: HttpRequestContext,
  requestId: string,
): void {
  const status = resolveErrorStatus(error);
  const metadata = {
    requestId,
    method: request.method,
    path: request.path,
    status,
    error: describeError(error),
  };
  if (status >= 500) {
    logger.error("Request failed", metadata);
  } else {
    logger.warn("Request rejected", metadata);
  }
}
