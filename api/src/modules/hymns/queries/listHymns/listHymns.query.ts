import { Query } from "@zudojs/cqrs";

export const LIST_HYMNS = "hymns.listHymns" as const;

export interface ListHymnsOptions {
  readonly page?: number;
  readonly limit?: number;
  readonly hymnal?: string;
  readonly topic?: string;
  readonly language?: string;
}

/** Browses hymns alphabetically with optional hymnal, topic and language filters. */
export class ListHymnsQuery extends Query<typeof LIST_HYMNS> {
  public readonly page: number;
  public readonly limit: number;
  public readonly hymnal: string | undefined;
  public readonly topic: string | undefined;
  public readonly language: string | undefined;

  public constructor(options: ListHymnsOptions = {}) {
    super(LIST_HYMNS);
    this.page = options.page ?? 1;
    this.limit = options.limit ?? 25;
    this.hymnal = options.hymnal;
    this.topic = options.topic;
    this.language = options.language;
  }
}
