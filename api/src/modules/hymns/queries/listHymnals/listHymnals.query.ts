import { Query } from "@zudojs/cqrs";

export const LIST_HYMNALS = "hymns.listHymnals" as const;

/** Lists every hymnal with its entry count. */
export class ListHymnalsQuery extends Query<typeof LIST_HYMNALS> {
  public constructor() {
    super(LIST_HYMNALS);
  }
}
