import type { RouteParameterMetadata } from "@zudojs/openapi";
import type { BibleController } from "../controllers/index.js";
import type { RouteSpec } from "../utils/http/route.helper.js";

const TAGS = ["bible"];

const translationParam: RouteParameterMetadata = {
  name: "translation",
  in: "path",
  required: true,
  description: "Translation code, for example KJV.",
  schema: { type: "string" },
};
const bookParam: RouteParameterMetadata = {
  name: "book",
  in: "path",
  required: true,
  description: "Book slug, name or abbreviation: john, 1-samuel, Ps.",
  schema: { type: "string" },
};
const chapterParam: RouteParameterMetadata = {
  name: "chapter",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};
const verseParam: RouteParameterMetadata = {
  name: "verse",
  in: "path",
  required: true,
  schema: { type: "integer", minimum: 1 },
};
const notFound = { description: "Unknown translation, book, chapter or verse." };

/** Public, read-only Bible endpoints. */
export function createBibleRoutes(controller: BibleController): readonly RouteSpec[] {
  return [
    {
      method: "GET",
      path: "/bible/translations",
      name: "bible.listTranslations",
      handler: () => controller.listTranslations(),
      openapi: {
        summary: "List available translations",
        tags: TAGS,
        responses: { "200": { description: "Translations, default first." } },
      },
    },
    {
      method: "GET",
      path: "/bible/:translation/books",
      name: "bible.listBooks",
      handler: (context) => controller.listBooks(context),
      openapi: {
        summary: "List the books of the canon",
        tags: TAGS,
        parameters: [translationParam],
        responses: { "200": { description: "Books in canonical order." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/export/bible/:translation",
      name: "bible.exportTranslation",
      handler: (context) => controller.exportTranslation(context),
      openapi: {
        summary: "Download a whole translation for offline use",
        description: "Every book and verse of the translation in one document (about 4.5 MB for the KJV). Cacheable for a day.",
        tags: [...TAGS, "export"],
        parameters: [translationParam],
        responses: { "200": { description: "Books, then verses as [bookOrder, chapter, verse, text] rows." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/bible/:translation/search",
      name: "bible.searchVerses",
      handler: (context) => controller.search(context),
      openapi: {
        summary: "Search verses by text",
        tags: TAGS,
        parameters: [
          translationParam,
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 25 } },
        ],
        responses: { "200": { description: "Ranked verses, best first." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/bible/:translation/:book/:chapter",
      name: "bible.getChapter",
      handler: (context) => controller.getChapter(context),
      openapi: {
        summary: "Read a chapter",
        tags: TAGS,
        parameters: [translationParam, bookParam, chapterParam],
        responses: { "200": { description: "Every verse of the chapter." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/bible/:translation/:book/:chapter/:verse/cross-references",
      name: "bible.getCrossReferences",
      handler: (context) => controller.getCrossReferences(context),
      openapi: {
        summary: "Passages related to a verse",
        description: "Cross-references from OpenBible.info (CC BY 4.0), strongest first, each with the text of its first verse in the requested translation. Cacheable for a day.",
        tags: TAGS,
        parameters: [translationParam, bookParam, chapterParam, verseParam, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 } }],
        responses: { "200": { description: "Related passages; an empty list when none are known." }, "404": notFound },
      },
    },
    {
      method: "GET",
      path: "/bible/:translation/:book/:chapter/:verse",
      name: "bible.getVerse",
      handler: (context) => controller.getVerse(context),
      openapi: {
        summary: "Read a verse with optional context",
        tags: TAGS,
        parameters: [
          translationParam,
          bookParam,
          chapterParam,
          verseParam,
          { name: "context", in: "query", description: "Verses to include on each side (0 to 5).", schema: { type: "integer", minimum: 0, maximum: 5 } },
        ],
        responses: { "200": { description: "The verse and its neighbours." }, "404": notFound },
      },
    },
  ];
}
