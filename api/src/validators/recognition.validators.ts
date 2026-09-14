import { z } from "@zudojs/validation";
import { MAX_RECOGNITION_TEXT_LENGTH } from "../constants/app.constants.js";
import { languageSchema } from "./hymns.validators.js";

export const recognitionModeSchema = z
  .enum(["bible", "hymn", "auto"])
  .default("auto")
  .transform((mode) => mode.toUpperCase() as "BIBLE" | "HYMN" | "AUTO");

/**
 * "auto" (the default) lets speech-to-text detect the language and searches
 * hymns in every language, so Yoruba, English or any other tongue works
 * without the app having to know in advance.
 */
export const recognitionLanguageSchema = z.union([z.literal("auto"), languageSchema]).default("auto");

export const recognizeTextBodySchema = z.object({
  text: z.string().trim().min(2).max(MAX_RECOGNITION_TEXT_LENGTH),
  mode: recognitionModeSchema,
  language: recognitionLanguageSchema,
});

export const recognizeAudioFieldsSchema = z.object({
  mode: recognitionModeSchema,
  language: recognitionLanguageSchema,
});

export const attemptParamsSchema = z.object({ id: z.string().uuid() });

export const searchAllQuerySchema = z.object({
  q: z.string().trim().min(2).max(300),
  type: z.enum(["all", "verses", "hymns"]).default("all"),
  limit: z.coerce.number().int().min(1).max(25).default(5),
  translation: z.string().trim().regex(/^[A-Za-z0-9]{2,12}$/).transform((value) => value.toUpperCase()).optional(),
  language: languageSchema.optional(),
});

export type RecognizeTextBody = z.infer<typeof recognizeTextBodySchema>;
export type RecognizeAudioFields = z.infer<typeof recognizeAudioFieldsSchema>;
