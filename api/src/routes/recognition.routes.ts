import type { HttpMiddleware } from "@zudojs/http";
import type { RecognitionController } from "../controllers/index.js";
import type { RouteSpec } from "../utils/http/route.helper.js";

const TAGS = ["recognition"];
const candidateResponses = {
  "200": { description: "The transcript and ranked candidates with confidence 0-100." },
  "400": { description: "Invalid input." },
  "429": { description: "Too many recognitions from this client." },
};

export interface RecognitionRouteMiddleware {
  readonly rateLimit: HttpMiddleware;
  /** Optional: a valid bearer token attributes the attempt to the member. */
  readonly authenticate: HttpMiddleware;
}

/** Public recognition endpoints, rate limited more tightly than the rest of the API. */
export function createRecognitionRoutes(controller: RecognitionController, middleware: RecognitionRouteMiddleware): readonly RouteSpec[] {
  const guarded = [middleware.rateLimit, middleware.authenticate];
  return [
    {
      method: "POST",
      path: "/recognize/text",
      name: "recognition.text",
      middleware: guarded,
      handler: (context) => controller.recognizeText(context),
      openapi: {
        summary: "Identify a verse or hymn from typed or spoken words",
        tags: TAGS,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", minLength: 2, maxLength: 1000 },
                  mode: { type: "string", enum: ["bible", "hymn", "auto"], default: "auto" },
                  language: { type: "string", default: "auto", description: "ISO 639 code such as en or yo, or auto to search hymns in every language." },
                },
              },
            },
          },
        },
        responses: candidateResponses,
      },
    },
    {
      method: "POST",
      path: "/recognize/audio",
      name: "recognition.audio",
      middleware: guarded,
      handler: (context) => controller.recognizeAudio(context),
      openapi: {
        summary: "Identify a verse or hymn from a recording",
        tags: TAGS,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["audio"],
                properties: {
                  audio: { type: "string", format: "binary", description: "webm, ogg, mp4, mpeg, wav, flac or aac; at most 5 MB." },
                  mode: { type: "string", enum: ["bible", "hymn", "auto"], default: "auto" },
                  language: { type: "string", default: "auto", description: "ISO 639 code such as en or yo, or auto to let speech-to-text detect it." },
                },
              },
            },
          },
        },
        responses: {
          ...candidateResponses,
          "422": { description: "No speech was recognized." },
          "503": { description: "Audio recognition is not configured." },
        },
      },
    },
    {
      method: "GET",
      path: "/recognize/attempts/:id",
      name: "recognition.getAttempt",
      middleware: [middleware.authenticate],
      handler: (context) => controller.getAttempt(context),
      openapi: {
        summary: "Read a past identification",
        tags: TAGS,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "The identification." }, "404": { description: "Unknown attempt." } },
      },
    },
  ];
}
