import { Command } from "@zudojs/cqrs";
import type { TranslationUpsertInput } from "../../../../repositories/index.js";

export const IMPORT_TRANSLATION = "bible.importTranslation" as const;

/** One book of a dataset: `chapters[c][v]` is the text of chapter c+1, verse v+1. */
export interface ImportBookInput {
  /** Canonical order, 1 to 66. */
  readonly order: number;
  readonly chapters: readonly (readonly string[])[];
}

export interface ImportTranslationInput {
  readonly translation: TranslationUpsertInput;
  readonly books: readonly ImportBookInput[];
}

export interface ImportTranslationResult {
  readonly translationId: string;
  readonly code: string;
  readonly bookCount: number;
  readonly verseCount: number;
  readonly durationMs: number;
}

/** Replaces every verse of a translation with the supplied dataset. */
export class ImportTranslationCommand extends Command<typeof IMPORT_TRANSLATION> {
  public readonly input: ImportTranslationInput;

  public constructor(input: ImportTranslationInput) {
    super(IMPORT_TRANSLATION);
    this.input = input;
  }
}
