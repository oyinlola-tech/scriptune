import type { HttpMiddleware, HttpRouter, RouterHandler } from "@zudojs/http";
import type { OpenAPIHttpMethod, OpenAPIManager, RouteOpenAPIMetadata } from "@zudojs/openapi";

export type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A route plus the documentation that describes it. */
export interface RouteSpec {
  readonly method: RouteMethod;
  readonly path: string;
  /** Unique, dot-namespaced name; doubles as the OpenAPI operationId. */
  readonly name: string;
  readonly handler: RouterHandler;
  readonly middleware?: readonly HttpMiddleware[];
  /** Omit to keep the route out of the generated document. */
  readonly openapi?: RouteOpenAPIMetadata;
}

const OPENAPI_METHODS: Readonly<Record<RouteMethod, OpenAPIHttpMethod>> = Object.freeze({
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "delete",
});

/**
 * Registers routes on the router and, when documented, on the OpenAPI
 * manager in one step so the two can never drift apart.
 */
export function registerRoutes(
  router: HttpRouter,
  openapi: OpenAPIManager,
  routes: readonly RouteSpec[],
): void {
  for (const route of routes) {
    router.on(route.method, route.path, route.handler, {
      name: route.name,
      ...(route.middleware === undefined ? {} : { middleware: route.middleware }),
    });
    if (route.openapi !== undefined) {
      openapi.addRoute({
        method: OPENAPI_METHODS[route.method],
        path: route.path,
        metadata: { openapi: { operationId: route.name, ...route.openapi } },
      });
    }
  }
}
