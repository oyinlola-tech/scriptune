import { z } from "@zudojs/validation";

/**
 * The shape of a hymnal JSON file for the generic importer. It carries the
 * hymnal's own rights, so collections used by permission (for example a
 * church's own hymnbook) are stored and credited correctly.
 */
export const stanzaSchema = z.object({
  number: z.number().int().min(1).max(50).nullable(),
  kind: z.enum(["verse", "chorus"]),
  lines: z.array(z.string().max(500)).min(1).max(50),
});

export const hymnalFileSchema = z.object({
  hymnal: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
    title: z.string().min(1).max(200),
    edition: z.string().max(120).optional(),
    year: z.number().int().min(1500).max(2200).optional(),
    publisher: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    rightsStatus: z.string().min(1).max(60),
  }),
  source: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
    name: z.string().min(1).max(300),
    url: z.string().url().max(500).optional(),
    edition: z.string().max(120).optional(),
    license: z.string().min(1).max(300),
    rightsStatus: z.string().min(1).max(60),
    notes: z.string().max(1000).optional(),
  }),
  entries: z.array(z.object({
    number: z.number().int().min(1).max(10_000),
    title: z.string().min(1).max(300),
    section: z.string().max(120).optional(),
    // Provide either a single language's stanzas, or `texts` for several
    // languages of the same hymn (for example English and Yoruba).
    language: z.string().min(2).max(10).default("en"),
    stanzas: z.array(stanzaSchema).max(60).optional(),
    texts: z.array(z.object({
      language: z.string().min(2).max(10),
      title: z.string().max(300).optional(),
      stanzas: z.array(stanzaSchema).min(1).max(60),
    })).min(1).max(6).optional(),
  }).refine((entry) => (entry.stanzas?.length ?? 0) > 0 || (entry.texts?.length ?? 0) > 0, {
    message: "Each hymn needs stanzas or a texts array.",
  })).min(1).max(5000),
});

export type HymnalFile = z.infer<typeof hymnalFileSchema>;
