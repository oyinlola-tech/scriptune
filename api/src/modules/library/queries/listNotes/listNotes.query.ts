import { Query } from "@zudojs/cqrs";

export const LIST_NOTES = "library.listNotes" as const;

/** Lists the member's notes, most recently edited first. */
export class ListNotesQuery extends Query<typeof LIST_NOTES> {
  public readonly userId: string;

  public constructor(userId: string) {
    super(LIST_NOTES);
    this.userId = userId;
  }
}
