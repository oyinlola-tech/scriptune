import { Command } from "@zudojs/cqrs";

export const DELETE_COLLECTION = "library.deleteCollection" as const;

/** Deletes a collection and its items. */
export class DeleteCollectionCommand extends Command<typeof DELETE_COLLECTION> {
  public readonly userId: string;
  public readonly slug: string;

  public constructor(userId: string, slug: string) {
    super(DELETE_COLLECTION);
    this.userId = userId;
    this.slug = slug;
  }
}
