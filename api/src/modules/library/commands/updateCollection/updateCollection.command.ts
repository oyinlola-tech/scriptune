import { Command } from "@zudojs/cqrs";

export const UPDATE_COLLECTION = "library.updateCollection" as const;

export interface UpdateCollectionInput {
  readonly userId: string;
  readonly slug: string;
  readonly name?: string;
  readonly description?: string | null;
}

/** Renames or re-describes a collection. The slug never changes, so links keep working. */
export class UpdateCollectionCommand extends Command<typeof UPDATE_COLLECTION> {
  public readonly input: UpdateCollectionInput;

  public constructor(input: UpdateCollectionInput) {
    super(UPDATE_COLLECTION);
    this.input = input;
  }
}
