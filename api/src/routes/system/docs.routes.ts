import type { OpenAPIManager } from "@zudojs/openapi";
import { API_TITLE } from "../../constants/app.constants.js";
import { fromDocumentResponse } from "../../utils/http/response.helper.js";
import type { RouteSpec } from "../../utils/http/route.helper.js";

/** Serves the OpenAPI document and an interactive reference for it. */
export function createDocsRoutes(openapi: OpenAPIManager): readonly RouteSpec[] {
  return [
    {
      method: "GET",
      path: "/openapi.json",
      name: "system.openapi",
      handler: () => fromDocumentResponse(openapi.toResponse({ format: "json" })),
    },
    {
      method: "GET",
      path: "/docs",
      name: "system.docs",
      handler: () =>
        fromDocumentResponse(
          openapi.toUIResponse({
            specUrl: "/openapi.json",
            title: API_TITLE,
            renderer: "swagger",
            logo: false,
            favicon: false,
          }),
        ),
    },
  ];
}
