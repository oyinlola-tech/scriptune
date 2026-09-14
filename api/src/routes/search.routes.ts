import type { SearchController } from "../controllers/index.js";
import type { RouteSpec } from "../utils/http/route.helper.js";

/** Unified search endpoint. */
export function createSearchRoutes(controller: SearchController): readonly RouteSpec[] {
  return [
    {
      method: "GET",
      path: "/search",
      name: "search.all",
      handler: (context) => controller.search(context),
      openapi: {
        summary: "Search verses and hymns at once",
        tags: ["search"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } },
          { name: "type", in: "query", schema: { type: "string", enum: ["all", "verses", "hymns"], default: "all" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 25, default: 5 } },
          { name: "translation", in: "query", schema: { type: "string" } },
          { name: "language", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Verse and hymn results, best first." } },
      },
    },
  ];
}
