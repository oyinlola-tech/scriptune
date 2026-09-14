import type { QueryBus } from "@zudojs/cqrs";
import { QueryHandler } from "@zudojs/cqrs";
import { toPublicHymnSearchHitDto, type HymnSearchHitDto, type VerseSearchHitDto } from "../../../../dtos/index.js";
import type { VerseSearchResultDto } from "../../../../dtos/index.js";
import { SearchVersesQuery } from "../../../bible/queries/index.js";
import { SearchHymnsQuery, type HymnSearchResultDto } from "../../../hymns/queries/index.js";
import { SEARCH_ALL, type SearchAllQuery } from "./searchAll.query.js";

export interface SearchAllResultDto {
  readonly query: string;
  /** `translation` is the one searched, or null when every translation was; each hit names its own. */
  readonly verses: { readonly translation: string | null; readonly results: readonly VerseSearchHitDto[] } | null;
  readonly hymns: { readonly results: readonly HymnSearchHitDto[] } | null;
}

/** Fans out to the bible and hymn searches through the query bus and merges the answers. */
export class SearchAllHandler extends QueryHandler<SearchAllQuery, SearchAllResultDto> {
  public readonly queryType = SEARCH_ALL;

  private readonly queryBus: QueryBus;
  private readonly defaultTranslation: string;

  public constructor(queryBus: QueryBus, defaultTranslation: string) {
    super();
    this.queryBus = queryBus;
    this.defaultTranslation = defaultTranslation;
  }

  public async execute(query: SearchAllQuery): Promise<SearchAllResultDto> {
    const translation = query.translation ?? null;
    const [verses, hymns] = await Promise.all([
      query.scope === "hymns"
        ? Promise.resolve(null)
        : this.queryBus.execute<SearchVersesQuery, VerseSearchResultDto>(new SearchVersesQuery(translation, query.text, query.limit)),
      query.scope === "verses"
        ? Promise.resolve(null)
        : this.queryBus.execute<SearchHymnsQuery, HymnSearchResultDto>(new SearchHymnsQuery(query.text, query.limit, query.language)),
    ]);
    return {
      query: query.text,
      verses: verses === null ? null : { translation: verses.translation?.code ?? null, results: verses.results },
      hymns: hymns === null ? null : { results: hymns.results.map(toPublicHymnSearchHitDto) },
    };
  }
}
