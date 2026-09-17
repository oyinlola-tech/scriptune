import { Command } from "@zudojs/cqrs";

export const RELATE_HYMNS = "hymns.relateHymns" as const;

export interface RelateHymnsResult {
  readonly hymnsCompared: number;
  readonly hymnsWithRelations: number;
  readonly relations: number;
  readonly durationMs: number;
}

/** Works out which hymns belong together and stores the pairs, replacing the earlier set. */
export class RelateHymnsCommand extends Command<typeof RELATE_HYMNS> {
  public constructor() {
    super(RELATE_HYMNS);
  }
}
