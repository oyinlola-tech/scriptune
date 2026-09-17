import { CommandHandler } from "@zudojs/cqrs";
import { ValidationError } from "@zudojs/errors";
import type { CrossReferenceRepository } from "../../../../repositories/index.js";
import { IMPORT_CROSS_REFERENCES, type ImportCrossReferencesCommand, type ImportCrossReferencesResult } from "./importCrossReferences.command.js";

export class ImportCrossReferencesHandler extends CommandHandler<ImportCrossReferencesCommand, ImportCrossReferencesResult> {
  public readonly commandType = IMPORT_CROSS_REFERENCES;

  private readonly crossReferences: CrossReferenceRepository;

  public constructor(crossReferences: CrossReferenceRepository) {
    super();
    this.crossReferences = crossReferences;
  }

  public async execute(command: ImportCrossReferencesCommand): Promise<ImportCrossReferencesResult> {
    if (command.rows.length === 0) {
      throw new ValidationError("There are no cross-references to import.");
    }
    const startedAt = performance.now();
    const stored = await this.crossReferences.replaceAll(command.rows);
    return { stored, durationMs: Math.round(performance.now() - startedAt) };
  }
}
