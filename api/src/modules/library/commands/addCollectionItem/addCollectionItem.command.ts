import { Command } from "@zudojs/cqrs";
import type { LibraryTarget } from "../../../../models/index.js";

export const ADD_COLLECTION_ITEM = "library.addCollectionItem" as const;

export interface AddCollectionItemInput {
  readonly userId: string;
  readonly slug: string;
  readonly target: LibraryTarget;
  readonly note?: string | null;
}

/** Appends a hymn or verse to a collection, or updates its note if already there. */
export class AddCollectionItemCommand extends Command<typeof ADD_COLLECTION_ITEM> {
  public readonly input: AddCollectionItemInput;

  public constructor(input: AddCollectionItemInput) {
    super(ADD_COLLECTION_ITEM);
    this.input = input;
  }
}
