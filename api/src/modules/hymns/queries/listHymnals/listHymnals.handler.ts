import { QueryHandler } from "@zudojs/cqrs";
import { toHymnalDto, type HymnalDto } from "../../../../dtos/index.js";
import type { HymnalRepository } from "../../../../repositories/index.js";
import { LIST_HYMNALS, type ListHymnalsQuery } from "./listHymnals.query.js";

export class ListHymnalsHandler extends QueryHandler<ListHymnalsQuery, readonly HymnalDto[]> {
  public readonly queryType = LIST_HYMNALS;

  private readonly hymnals: HymnalRepository;

  public constructor(hymnals: HymnalRepository) {
    super();
    this.hymnals = hymnals;
  }

  public async execute(): Promise<readonly HymnalDto[]> {
    const hymnals = await this.hymnals.findAll();
    return hymnals.map((hymnal) => toHymnalDto(hymnal, hymnal.entryCount));
  }
}
