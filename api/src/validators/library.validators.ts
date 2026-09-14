import { z } from "@zudojs/validation";
import { MAX_HISTORY_IMPORT } from "../constants/app.constants.js";

export const targetTypeSchema = z.enum(["hymn", "verse"]);
export const targetKeySchema = z.string().trim().min(1).max(120);

export const targetParamsSchema = z.object({ type: targetTypeSchema, key: targetKeySchema });
export const targetBodySchema = targetParamsSchema;

export const savedQuerySchema = z.object({ type: targetTypeSchema.optional() });

export const collectionBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
});

export const collectionUpdateSchema = collectionBodySchema.partial();

export const collectionParamsSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
});

export const collectionItemBodySchema = targetBodySchema.extend({
  note: z.string().trim().max(500).nullable().optional(),
});

export const noteBodySchema = z.object({ body: z.string().trim().min(1).max(5_000) });

export const historyEntrySchema = z.object({
  kind: z.enum(["identify", "search", "view"]),
  mode: z.string().trim().max(20).nullable().optional(),
  query: z.string().trim().min(1).max(500),
  type: targetTypeSchema.optional(),
  key: targetKeySchema.optional(),
  attemptId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
});

export const historyImportBodySchema = z.object({
  entries: z.array(historyEntrySchema).min(1).max(MAX_HISTORY_IMPORT),
});

export const historyQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

export type HistoryEntryBody = z.infer<typeof historyEntrySchema>;
