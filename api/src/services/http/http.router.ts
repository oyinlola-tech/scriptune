import { HttpRouter, methodNotAllowed, notFound } from "@zudojs/http";
import { toErrorResponse } from "../../errors/error.mapper.js";
import { getRequestId } from "../../middlewares/requestId.middleware.js";

/** Creates the shared router with JSON error responses for misses. */
export function createAppRouter(): HttpRouter {
  return new HttpRouter({
    notFoundHandler: (context) =>
      toErrorResponse(
        notFound(`No route matches ${context.method} ${context.path}.`),
        getRequestId(context.request),
      ),
    methodNotAllowedHandler: (context, allowed) =>
      toErrorResponse(
        methodNotAllowed(`${context.method} is not allowed for ${context.path}.`, {
          headers: { allow: allowed.join(", ") },
        }),
        getRequestId(context.request),
      ),
  });
}
