import { Query } from "@zudojs/cqrs";

export const GET_VERSES_BY_KEYS = "bible.getVersesByKeys" as const;

export interface VerseKeyInput {
  readonly translation: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
}

/** Resolves many verse keys at once, for libraries and history. */
export class GetVersesByKeysQuery extends Query<typeof GET_VERSES_BY_KEYS> {
  public readonly keys: readonly VerseKeyInput[];

  public constructor(keys: readonly VerseKeyInput[]) {
    super(GET_VERSES_BY_KEYS);
    this.keys = keys;
  }
}
