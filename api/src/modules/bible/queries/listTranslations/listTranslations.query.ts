import { Query } from "@zudojs/cqrs";

export const LIST_TRANSLATIONS = "bible.listTranslations" as const;

/** Lists every available translation, default first. */
export class ListTranslationsQuery extends Query<typeof LIST_TRANSLATIONS> {
  public constructor() {
    super(LIST_TRANSLATIONS);
  }
}
