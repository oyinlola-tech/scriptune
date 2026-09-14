import { z } from "@zudojs/validation";

export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slugs are lowercase words joined by hyphens.")
  .max(80);

export const languageSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}$/, "Language codes are 2 or 3 lowercase letters.");

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageLimitSchema = z.coerce.number().int().min(1).max(100).default(25);

export const hymnParamsSchema = z.object({ slug: slugSchema });

export const hymnListQuerySchema = z.object({
  page: pageSchema,
  limit: pageLimitSchema,
  hymnal: slugSchema.optional(),
  topic: slugSchema.optional(),
  language: languageSchema.optional(),
});

export const hymnSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(300),
  limit: z.coerce.number().int().min(1).max(25).default(10),
  language: languageSchema.optional(),
});

export const hymnalParamsSchema = z.object({ slug: slugSchema });

export const hymnalEntriesQuerySchema = z.object({ page: pageSchema, limit: pageLimitSchema });

export const hymnalEntryParamsSchema = hymnalParamsSchema.extend({
  number: z.coerce.number().int().min(1).max(10_000),
});

export type HymnListQuery = z.infer<typeof hymnListQuerySchema>;
export type HymnSearchQuery = z.infer<typeof hymnSearchQuerySchema>;
export type HymnalEntriesQuery = z.infer<typeof hymnalEntriesQuerySchema>;
