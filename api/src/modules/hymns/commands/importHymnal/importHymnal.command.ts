import { Command } from "@zudojs/cqrs";
import type { Stanza } from "../../../../models/index.js";
import type { HymnalUpsertInput, SourceUpsertInput } from "../../../../repositories/index.js";

export const IMPORT_HYMNAL = "hymns.importHymnal" as const;

/** One language of a hymn: its own title and stanzas (English, Yoruba, …). */
export interface ImportHymnTextInput {
  readonly language: string;
  readonly title?: string;
  readonly stanzas: readonly Stanza[];
}

/**
 * One numbered hymn of the hymnal being imported. Provide either a single
 * `language` + `stanzas` (one language) or `texts` (several languages of the
 * same hymn, such as English and Yoruba).
 */
export interface ImportHymnEntryInput {
  readonly number: number;
  readonly title: string;
  readonly language?: string;
  readonly stanzas?: readonly Stanza[];
  readonly texts?: readonly ImportHymnTextInput[];
  readonly section?: string | null;
  readonly rightsStatus?: string;
}

export interface ImportHymnalInput {
  readonly source: SourceUpsertInput;
  readonly hymnal: Omit<HymnalUpsertInput, "sourceId">;
  readonly entries: readonly ImportHymnEntryInput[];
}

export interface ImportHymnalResult {
  readonly hymnalId: string;
  readonly hymnalSlug: string;
  readonly hymnCount: number;
  readonly durationMs: number;
}

/** Creates or updates every hymn of a hymnal, keyed by hymnal slug and number. */
export class ImportHymnalCommand extends Command<typeof IMPORT_HYMNAL> {
  public readonly input: ImportHymnalInput;

  public constructor(input: ImportHymnalInput) {
    super(IMPORT_HYMNAL);
    this.input = input;
  }
}
