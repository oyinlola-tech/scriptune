import type { HttpMiddleware } from "@zudojs/http";
import type { CollectionsController } from "../../controllers/index.js";
import type { RouteSpec } from "../../utils/http/route.helper.js";

const TAGS = ["library"];
const security = [{ bearerAuth: [] }];
const responses = { "401": { description: "Sign in required." }, "404": { description: "Unknown collection." } };
const slugParam = { name: "slug", in: "path" as const, required: true, schema: { type: "string" } };

/** Collections and their items. All routes require a bearer token. */
export function createCollectionRoutes(controller: CollectionsController, guard: readonly HttpMiddleware[]): readonly RouteSpec[] {
  const route = (spec: Omit<RouteSpec, "middleware">): RouteSpec => ({ ...spec, middleware: guard });
  return [
    route({ method: "GET", path: "/library/collections", name: "library.listCollections", handler: (c) => controller.list(c),
      openapi: { summary: "List collections", tags: TAGS, security, responses: { "200": { description: "Collections with item counts." }, ...responses } } }),
    route({ method: "POST", path: "/library/collections", name: "library.createCollection", handler: (c) => controller.create(c),
      openapi: { summary: "Create a collection", tags: TAGS, security, responses: { "201": { description: "Created." }, ...responses } } }),
    route({ method: "GET", path: "/library/collections/:slug", name: "library.getCollection", handler: (c) => controller.get(c),
      openapi: { summary: "Read a collection with its items", tags: TAGS, security, parameters: [slugParam], responses: { "200": { description: "The collection." }, ...responses } } }),
    route({ method: "PATCH", path: "/library/collections/:slug", name: "library.updateCollection", handler: (c) => controller.update(c),
      openapi: { summary: "Rename or re-describe a collection", tags: TAGS, security, parameters: [slugParam], responses: { "200": { description: "Updated." }, ...responses } } }),
    route({ method: "DELETE", path: "/library/collections/:slug", name: "library.deleteCollection", handler: (c) => controller.remove(c),
      openapi: { summary: "Delete a collection", tags: TAGS, security, parameters: [slugParam], responses: { "204": { description: "Deleted." }, ...responses } } }),
    route({ method: "POST", path: "/library/collections/:slug/items", name: "library.addCollectionItem", handler: (c) => controller.addItem(c),
      openapi: { summary: "Add a hymn or verse to a collection", tags: TAGS, security, parameters: [slugParam], responses: { "201": { description: "Added." }, ...responses } } }),
    route({ method: "DELETE", path: "/library/collections/:slug/items/:type/:key", name: "library.removeCollectionItem", handler: (c) => controller.removeItem(c),
      openapi: { summary: "Remove an item from a collection", tags: TAGS, security, parameters: [slugParam], responses: { "204": { description: "Removed." }, ...responses } } }),
  ];
}
