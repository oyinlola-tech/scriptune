import { QueryHandler } from "@zudojs/cqrs";
import type { TopicDto } from "../../../../dtos/index.js";
import type { HymnLinkRepository } from "../../../../repositories/index.js";
import { LIST_TOPICS, type ListTopicsQuery } from "./listTopics.query.js";

export interface TopicWithCountDto extends TopicDto {
  readonly hymnCount: number;
}

export class ListTopicsHandler extends QueryHandler<ListTopicsQuery, readonly TopicWithCountDto[]> {
  public readonly queryType = LIST_TOPICS;

  private readonly links: HymnLinkRepository;

  public constructor(links: HymnLinkRepository) {
    super();
    this.links = links;
  }

  public async execute(): Promise<readonly TopicWithCountDto[]> {
    const topics = await this.links.listTopics();
    return topics.map((topic) => ({ slug: topic.slug, name: topic.name, hymnCount: topic.hymnCount }));
  }
}
