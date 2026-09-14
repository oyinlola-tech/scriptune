import { Query } from "@zudojs/cqrs";

export const LIST_TOPICS = "hymns.listTopics" as const;

/** Lists hymn topics with the number of hymns under each. */
export class ListTopicsQuery extends Query<typeof LIST_TOPICS> {
  public constructor() {
    super(LIST_TOPICS);
  }
}
