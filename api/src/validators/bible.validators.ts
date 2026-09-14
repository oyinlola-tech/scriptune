import { z } from "@zudojs/validation";

export const translationCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{2,12}$/, "Translation codes are 2 to 12 letters or digits.")
  .transform((value) => value.toUpperCase());

export const bookReferenceSchema = z.string().trim().min(1).max(64);
export const chapterNumberSchema = z.coerce.number().int().min(1).max(150);
export const verseNumberSchema = z.coerce.number().int().min(1).max(176);

export const translationParamsSchema = z.object({ translation: translationCodeSchema });

export const bookParamsSchema = translationParamsSchema.extend({ book: bookReferenceSchema });

export const chapterParamsSchema = bookParamsSchema.extend({ chapter: chapterNumberSchema });

export const verseParamsSchema = chapterParamsSchema.extend({ verse: verseNumberSchema });

export const verseQuerySchema = z.object({
  context: z.coerce.number().int().min(0).max(5).default(0),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export type TranslationParams = z.infer<typeof translationParamsSchema>;
export type BookParams = z.infer<typeof bookParamsSchema>;
export type ChapterParams = z.infer<typeof chapterParamsSchema>;
export type VerseParams = z.infer<typeof verseParamsSchema>;
export type VerseQuery = z.infer<typeof verseQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
