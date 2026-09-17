import { Command } from "@zudojs/cqrs";
import type { CrossReferenceInput } from "../../../../repositories/index.js";

export const IMPORT_CROSS_REFERENCES = "bible.importCrossReferences" as const;

export interface ImportCrossReferencesResult {
  readonly stored: number;
  readonly durationMs: number;
}

/** Replaces every cross-reference with the given set. */
export class ImportCrossReferencesCommand extends Command<typeof IMPORT_CROSS_REFERENCES> {
  public readonly rows: readonly CrossReferenceInput[];

  public constructor(rows: readonly CrossReferenceInput[]) {
    super(IMPORT_CROSS_REFERENCES);
    this.rows = rows;
  }
}
