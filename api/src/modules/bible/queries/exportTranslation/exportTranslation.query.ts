import { Query } from "@zudojs/cqrs";

export const EXPORT_TRANSLATION = "bible.exportTranslation" as const;

/** Reads a whole translation for offline clients. */
export class ExportTranslationQuery extends Query<typeof EXPORT_TRANSLATION> {
  public readonly translation: string;

  public constructor(translation: string) {
    super(EXPORT_TRANSLATION);
    this.translation = translation;
  }
}
