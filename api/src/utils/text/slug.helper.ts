import { normalizeText } from "./text.helper.js";

const MAX_SLUG_LENGTH = 80;

/**
 * Builds a URL slug from free text: lowercase ASCII words joined by hyphens.
 * Non-ASCII letters (CJK, Cyrillic, …) survive `normalizeText`, so they are
 * dropped here — otherwise a collection would get a slug the route validator
 * (`^[a-z0-9-]+$`) rejects, stranding it. `fallback` covers all-symbol names.
 */
export function slugify(input: string, fallback = "item"): string {
  const ascii = normalizeText(input).replace(/[^a-z0-9\s-]/g, " ");
  const slug = ascii.replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (slug === "") return fallback;
  return slug.length > MAX_SLUG_LENGTH ? slug.slice(0, MAX_SLUG_LENGTH).replace(/-[^-]*$/, "") : slug;
}
