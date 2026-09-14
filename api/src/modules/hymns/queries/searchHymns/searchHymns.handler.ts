import { QueryHandler } from "@zudojs/cqrs";
import { toHymnSearchHitDto, type HymnSearchHitDto } from "../../../../dtos/index.js";
import type { HymnTextRepository } from "../../../../repositories/index.js";
import { normalizeText } from "../../../../utils/text/text.helper.js";
import { SEARCH_HYMNS, type SearchHymnsQuery } from "./searchHymns.query.js";

export interface HymnSearchResultDto {
  readonly query: string;
  readonly results: readonly HymnSearchHitDto[];
}

export class SearchHymnsHandler extends QueryHandler<SearchHymnsQuery, HymnSearchResultDto> {
  public readonly queryType = SEARCH_HYMNS;

  private readonly texts: HymnTextRepository;

  public constructor(texts: HymnTextRepository) {
    super();
    this.texts = texts;
  }

  public async execute(query: SearchHymnsQuery): Promise<HymnSearchResultDto> {
    const normalizedText = normalizeText(query.text);
    if (normalizedText === "") {
      return { query: query.text, results: [] };
    }
    const hits = await this.texts.search({
      text: query.text,
      normalizedText,
      limit: query.limit,
      ...(query.language === undefined ? {} : { language: query.language }),
    });
    return { query: query.text, results: hits.map(toHymnSearchHitDto) };
  }
}
