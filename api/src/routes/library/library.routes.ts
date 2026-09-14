import type { HttpMiddleware } from "@zudojs/http";
import type { LibraryController } from "../../controllers/index.js";
import type { RouteSpec } from "../../utils/http/route.helper.js";

const TAGS = ["library"];
const security = [{ bearerAuth: [] }];
const unauthorized = { "401": { description: "Sign in required." } };
const targetParams = [
  { name: "type", in: "path" as const, required: true, schema: { type: "string", enum: ["hymn", "verse"] } },
  { name: "key", in: "path" as const, required: true, description: "Hymn slug or verse key such as KJV:john:3:16.", schema: { type: "string" } },
];
const targetBody = {
  required: true,
  content: { "application/json": { schema: { type: "object", required: ["type", "key"], properties: { type: { type: "string", enum: ["hymn", "verse"] }, key: { type: "string" } } } } },
};

/** Saved items, notes and history. All routes require a bearer token. */
export function createLibraryRoutes(controller: LibraryController, guard: readonly HttpMiddleware[]): readonly RouteSpec[] {
  const route = (spec: Omit<RouteSpec, "middleware">): RouteSpec => ({ ...spec, middleware: guard });
  return [
    route({ method: "GET", path: "/library/saved", name: "library.listSaved", handler: (c) => controller.listSaved(c),
      openapi: { summary: "List saved hymns and verses", tags: TAGS, security, parameters: [{ name: "type", in: "query", schema: { type: "string", enum: ["hymn", "verse"] } }], responses: { "200": { description: "Saved items, newest first." }, ...unauthorized } } }),
    route({ method: "POST", path: "/library/saved", name: "library.save", handler: (c) => controller.save(c),
      openapi: { summary: "Save a hymn or verse", tags: TAGS, security, requestBody: targetBody, responses: { "201": { description: "Saved." }, ...unauthorized } } }),
    route({ method: "DELETE", path: "/library/saved/:type/:key", name: "library.unsave", handler: (c) => controller.unsave(c),
      openapi: { summary: "Remove a saved hymn or verse", tags: TAGS, security, parameters: targetParams, responses: { "204": { description: "Removed." }, ...unauthorized } } }),
    route({ method: "GET", path: "/library/notes", name: "library.listNotes", handler: (c) => controller.listNotes(c),
      openapi: { summary: "List notes", tags: TAGS, security, responses: { "200": { description: "Notes, most recently edited first." }, ...unauthorized } } }),
    route({ method: "PUT", path: "/library/notes/:type/:key", name: "library.putNote", handler: (c) => controller.putNote(c),
      openapi: { summary: "Write a note on a hymn or verse", tags: TAGS, security, parameters: targetParams, responses: { "200": { description: "The note." }, ...unauthorized } } }),
    route({ method: "DELETE", path: "/library/notes/:type/:key", name: "library.deleteNote", handler: (c) => controller.deleteNote(c),
      openapi: { summary: "Delete a note", tags: TAGS, security, parameters: targetParams, responses: { "204": { description: "Deleted." }, ...unauthorized } } }),
    route({ method: "GET", path: "/library/history", name: "library.listHistory", handler: (c) => controller.listHistory(c),
      openapi: { summary: "List recent identifications, searches and views", tags: TAGS, security, parameters: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }], responses: { "200": { description: "History, newest first." }, ...unauthorized } } }),
    route({ method: "POST", path: "/library/history", name: "library.addHistory", handler: (c) => controller.addHistory(c),
      openapi: { summary: "Record a history entry", tags: TAGS, security, responses: { "201": { description: "Recorded." }, ...unauthorized } } }),
    route({ method: "POST", path: "/library/history/import", name: "library.importHistory", handler: (c) => controller.importHistory(c),
      openapi: { summary: "Import a guest's local history after sign-up (up to 200 entries)", tags: TAGS, security, responses: { "201": { description: "Imported." }, ...unauthorized } } }),
    route({ method: "DELETE", path: "/library/history", name: "library.clearHistory", handler: (c) => controller.clearHistory(c),
      openapi: { summary: "Clear history", tags: TAGS, security, responses: { "204": { description: "Cleared." }, ...unauthorized } } }),
  ];
}
