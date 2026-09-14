import { REQUEST_ID_HEADER, type HttpMiddleware, type HttpRequestContext } from "@zudojs/http";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/** Returns the request id assigned to a request by the middleware below. */
export function getRequestId(request: HttpRequestContext): string {
  return request.getHeader(REQUEST_ID_HEADER) ?? request.id;
}

/**
 * Honours a well-formed incoming `x-request-id`, otherwise assigns one, and
 * echoes it on the response so clients can quote it in bug reports.
 */
export function createRequestIdMiddleware(): HttpMiddleware {
  return async (context, next) => {
    const incoming = context.request.getHeader(REQUEST_ID_HEADER);
    const requestId =
      incoming !== undefined && REQUEST_ID_PATTERN.test(incoming) ? incoming : context.request.id;
    context.request.setHeader(REQUEST_ID_HEADER, requestId);
    const response = await next();
    return response.header(REQUEST_ID_HEADER, requestId);
  };
}
