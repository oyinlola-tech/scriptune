import type { HttpMiddleware, HttpRouter } from "@zudojs/http";

/** Terminal middleware: hands the request to the router. */
export function createRouterMiddleware(router: HttpRouter): HttpMiddleware {
  return async (context) => {
    const result = await router.dispatch(context.request, { signal: context.signal });
    return result.response;
  };
}
