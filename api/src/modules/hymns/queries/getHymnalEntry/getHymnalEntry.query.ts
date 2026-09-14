import { Query } from "@zudojs/cqrs";

export const GET_HYMNAL_ENTRY = "hymns.getHymnalEntry" as const;

/** Resolves "hymn number N of hymnal X" to the hymn itself. */
export class GetHymnalEntryQuery extends Query<typeof GET_HYMNAL_ENTRY> {
  public readonly hymnal: string;
  public readonly number: number;

  public constructor(hymnal: string, number: number) {
    super(GET_HYMNAL_ENTRY);
    this.hymnal = hymnal;
    this.number = number;
  }
}
