import { Query } from "@zudojs/cqrs";

export const LIST_BOOKS = "bible.listBooks" as const;

/** Lists the books of the canon with chapter counts for a translation. */
export class ListBooksQuery extends Query<typeof LIST_BOOKS> {
  public readonly translation: string;

  public constructor(translation: string) {
    super(LIST_BOOKS);
    this.translation = translation;
  }
}
