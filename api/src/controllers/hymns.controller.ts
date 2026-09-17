import type { QueryBus } from "@zudojs/cqrs";
import type { HttpRouterContext, HttpResponseContext } from "@zudojs/http";
import { EXPORT_CACHE_SECONDS } from "../constants/index.js";
import type { HymnalDto, HymnalExportDto, HymnDetailDto, HymnSummaryDto, PageDto, RelatedHymnsDto } from "../dtos/index.js";
import {
  GetHymnalEntryQuery,
  ExportHymnalQuery,
  GetHymnalQuery,
  GetHymnQuery,
  GetRelatedHymnsQuery,
  ListHymnalsQuery,
  ListHymnsForVerseQuery,
  ListHymnsQuery,
  ListTopicsQuery,
  SearchHymnsQuery,
  type HymnalPageDto,
  type HymnSearchResultDto,
  type HymnsForVerseDto,
  type TopicWithCountDto,
} from "../modules/hymns/queries/index.js";
import { toPublicHymnSearchHitDto } from "../dtos/index.js";
import { cachedJsonResponse, jsonResponse } from "../utils/http/response.helper.js";
import { parseOrBadRequest } from "../utils/http/validation.helper.js";
import { verseParamsSchema } from "../validators/bible.validators.js";
import {
  hymnalEntriesQuerySchema,
  hymnalEntryParamsSchema,
  hymnalParamsSchema,
  hymnListQuerySchema,
  hymnParamsSchema,
  hymnSearchQuerySchema,
} from "../validators/hymns.validators.js";

/** Translates hymn HTTP requests into queries. */
export class HymnsController {
  private readonly queryBus: QueryBus;

  public constructor(queryBus: QueryBus) {
    this.queryBus = queryBus;
  }

  public async list(context: HttpRouterContext): Promise<HttpResponseContext> {
    const options = parseOrBadRequest(hymnListQuerySchema, context.query, "query");
    return jsonResponse(await this.queryBus.execute<ListHymnsQuery, PageDto<HymnSummaryDto>>(new ListHymnsQuery(options)));
  }

  public async search(context: HttpRouterContext): Promise<HttpResponseContext> {
    const options = parseOrBadRequest(hymnSearchQuerySchema, context.query, "search query");
    const result = await this.queryBus.execute<SearchHymnsQuery, HymnSearchResultDto>(
      new SearchHymnsQuery(options.q, options.limit, options.language),
    );
    return jsonResponse({ ...result, results: result.results.map(toPublicHymnSearchHitDto) });
  }

  public async get(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(hymnParamsSchema, context.params, "hymn slug");
    return jsonResponse(await this.queryBus.execute<GetHymnQuery, HymnDetailDto>(new GetHymnQuery(params.slug)));
  }

  public async listHymnals(): Promise<HttpResponseContext> {
    return jsonResponse({ hymnals: await this.queryBus.execute<ListHymnalsQuery, readonly HymnalDto[]>(new ListHymnalsQuery()) });
  }

  public async exportHymnal(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(hymnalParamsSchema, context.params, "hymnal slug");
    const dump = await this.queryBus.execute<ExportHymnalQuery, HymnalExportDto>(new ExportHymnalQuery(params.slug));
    return cachedJsonResponse(dump, EXPORT_CACHE_SECONDS);
  }

  public async getRelated(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(hymnParamsSchema, context.params, "hymn slug");
    const options = parseOrBadRequest(relatedHymnsQuerySchema, context.query, "query");
    const result = await this.queryBus.execute<GetRelatedHymnsQuery, RelatedHymnsDto>(new GetRelatedHymnsQuery(params.slug, options.limit));
    return cachedJsonResponse(result, EXPORT_CACHE_SECONDS);
  }

  public async getHymnal(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(hymnalParamsSchema, context.params, "hymnal slug");
    const options = parseOrBadRequest(hymnalEntriesQuerySchema, context.query, "query");
    return jsonResponse(
      await this.queryBus.execute<GetHymnalQuery, HymnalPageDto>(new GetHymnalQuery(params.slug, options.page, options.limit)),
    );
  }

  public async getHymnalEntry(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(hymnalEntryParamsSchema, context.params, "hymnal entry");
    return jsonResponse(
      await this.queryBus.execute<GetHymnalEntryQuery, HymnDetailDto>(new GetHymnalEntryQuery(params.slug, params.number)),
    );
  }

  public async listTopics(): Promise<HttpResponseContext> {
    return jsonResponse({ topics: await this.queryBus.execute<ListTopicsQuery, readonly TopicWithCountDto[]>(new ListTopicsQuery()) });
  }

  public async listForVerse(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(verseParamsSchema, context.params, "verse reference");
    return jsonResponse(
      await this.queryBus.execute<ListHymnsForVerseQuery, HymnsForVerseDto>(
        new ListHymnsForVerseQuery(params.book, params.chapter, params.verse),
      ),
    );
  }
}
