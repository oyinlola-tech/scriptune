import type { RouteParameterMetadata } from "@zudojs/openapi";
import type { HymnsController } from "../controllers/index.js";
import type { RouteSpec } from "../utils/http/route.helper.js";

const TAGS = ["hymns"];
const slugParam: RouteParameterMetadata = { name: "slug", in: "path", required: true, schema: { type: "string" } };
const pageParams: readonly RouteParameterMetadata[] = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
];
const notFound = { description: "Unknown hymn, hymnal or number." };

/** Public, read-only hymn endpoints. */
export function createHymnRoutes(controller: HymnsController): readonly RouteSpec[] {
  return [
    {
      method: "GET",
      path: "/hymns",
      name: "hymns.list",
      handler: (context) => controller.list(context),
      openapi: {
        summary: "Browse hymns alphabetically",
        tags: TAGS,
        parameters: [
          ...pageParams,
          { name: "hymnal", in: "query", schema: { type: "string" } },
          { name: "topic", in: "query", schema: { type: "string" } },
          { name: "language", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "A page of hymns." } },
      },
    },
    {
      method: "GET",
      path: "/hymns/search",
      name: "hymns.search",
      handler: (context) => controller.search(context),
      openapi: {
        summary: "Search hymns by lyrics or title",
        tags: TAGS,
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 25 } },
          { name: "language", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Ranked hymns, best first." } },
      },
    },
    {
      method: "GET",
      path: "/hymns/:slug",
      name: "hymns.get",
      handler: (context) => controller.get(context),
      openapi: { summary: "Read a hymn", tags: TAGS, parameters: [slugParam], responses: { "200": { description: "The hymn with its texts and links." }, "404": notFound } },
    },
    {
      method: "GET",
      path: "/hymnals",
      name: "hymns.listHymnals",
      handler: () => controller.listHymnals(),
      openapi: { summary: "List hymnals", tags: TAGS, responses: { "200": { description: "Hymnals with entry counts." } } },
    },
    {
      method: "GET",
      path: "/export/hymnals/:slug",
      name: "hymns.exportHymnal",
      handler: (context) => controller.exportHymnal(context),
      openapi: {
        summary: "Download a whole hymnal for offline use",
        description: "Every hymn of the hymnal with its words in one document. Cacheable for a day.",
        tags: [...TAGS, "export"],
        parameters: [slugParam],
        responses: { "200": { description: "The hymnal and its hymns with stanzas." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/hymnals/:slug",
      name: "hymns.getHymnal",
      handler: (context) => controller.getHymnal(context),
      openapi: { summary: "Read a hymnal's table of contents", tags: TAGS, parameters: [slugParam, ...pageParams], responses: { "200": { description: "The hymnal and a page of entries." }, "404": notFound } },
    },
    {
      method: "GET",
      path: "/hymnals/:slug/:number",
      name: "hymns.getHymnalEntry",
      handler: (context) => controller.getHymnalEntry(context),
      openapi: {
        summary: "Read a hymn by its number in a hymnal",
        tags: TAGS,
        parameters: [slugParam, { name: "number", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: { "200": { description: "The hymn." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/topics",
      name: "hymns.listTopics",
      handler: () => controller.listTopics(),
      openapi: { summary: "List hymn topics", tags: TAGS, responses: { "200": { description: "Topics with hymn counts." } } },
    },
    {
      method: "GET",
      path: "/bible/:translation/:book/:chapter/:verse/related",
      name: "bible.relatedHymns",
      handler: (context) => controller.listForVerse(context),
      openapi: {
        summary: "Hymns that reference a verse",
        tags: ["bible", "hymns"],
        parameters: ["translation", "book", "chapter", "verse"].map((name) => ({ name, in: "path" as const, required: true, schema: { type: "string" } })),
        responses: { "200": { description: "Hymns whose scripture references cover the verse." }, "404": notFound },
      },
    },
  ];
}
