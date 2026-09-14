import { slugify } from "../../utils/text/slug.helper.js";

/**
 * Hands out unique hymn slugs during an import.
 *
 * A hymn that was imported before keeps its slug so shared links survive
 * re-imports. New hymns get the slug of their title, with the hymnal number
 * appended when another hymn already owns that slug.
 */
export class HymnSlugAllocator {
  private readonly byImportKey: ReadonlyMap<string, string>;
  private readonly taken: Set<string>;

  public constructor(byImportKey: ReadonlyMap<string, string>, taken: ReadonlySet<string>) {
    this.byImportKey = byImportKey;
    this.taken = new Set(taken);
  }

  public allocate(importKey: string, title: string, number: number): string {
    const existing = this.byImportKey.get(importKey);
    if (existing !== undefined) {
      return existing;
    }
    const base = slugify(title, `hymn-${number}`);
    let candidate = base;
    if (this.taken.has(candidate)) {
      candidate = `${base}-${number}`;
    }
    for (let attempt = 2; this.taken.has(candidate); attempt += 1) {
      candidate = `${base}-${number}-${attempt}`;
    }
    this.taken.add(candidate);
    return candidate;
  }
}
