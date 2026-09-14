import { Command } from "@zudojs/cqrs";

export const CREATE_COLLECTION = "library.createCollection" as const;

export interface CreateCollectionInput {
  readonly userId: string;
  readonly name: string;
  readonly description?: string | null;
}

/** Creates a named collection; its slug is derived from the name. */
export class CreateCollectionCommand extends Command<typeof CREATE_COLLECTION> {
  public readonly input: CreateCollectionInput;

  public constructor(input: CreateCollectionInput) {
    super(CREATE_COLLECTION);
    this.input = input;
  }
}
