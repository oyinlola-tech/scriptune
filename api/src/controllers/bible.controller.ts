import type { QueryBus } from "@zudojs/cqrs";
import type { HttpRouterContext, HttpResponseContext } from "@zudojs/http";
import { EXPORT_CACHE_SECONDS } from "../constants/index.js";
import type { BibleExportDto, ChapterDto, TranslationDto, VerseDetailDto, VerseSearchResultDto } from "../dtos/index.js";
import {
  ExportTranslationQuery,
  GetChapterQuery,
  GetVerseQuery,
  ListBooksQuery,
  ListTranslationsQuery,
  SearchVersesQuery,
  type BookListDto,
} from "../modules/bible/queries/index.js";
import { cachedJsonResponse, jsonResponse } from "../utils/http/response.helper.js";
import { parseOrBadRequest } from "../utils/http/validation.helper.js";
import {
  chapterParamsSchema,
  searchQuerySchema,
  translationParamsSchema,
  verseParamsSchema,
  verseQuerySchema,
} from "../validators/bible.validators.js";

/** Translates Bible HTTP requests into queries. */
export class BibleController {
  private readonly queryBus: QueryBus;

  public constructor(queryBus: QueryBus) {
    this.queryBus = queryBus;
  }

  public async listTranslations(): Promise<HttpResponseContext> {
    const translations = await this.queryBus.execute<ListTranslationsQuery, readonly TranslationDto[]>(
      new ListTranslationsQuery(),
    );
    return jsonResponse({ translations });
  }

  public async exportTranslation(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(translationParamsSchema, context.params, "translation");
    const dump = await this.queryBus.execute<ExportTranslationQuery, BibleExportDto>(new ExportTranslationQuery(params.translation));
    return cachedJsonResponse(dump, EXPORT_CACHE_SECONDS);
  }

  public async listBooks(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(translationParamsSchema, context.params, "translation");
    const result = await this.queryBus.execute<ListBooksQuery, BookListDto>(
      new ListBooksQuery(params.translation),
    );
    return jsonResponse(result);
  }

  public async getChapter(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(chapterParamsSchema, context.params, "chapter reference");
    const result = await this.queryBus.execute<GetChapterQuery, ChapterDto>(
      new GetChapterQuery(params.translation, params.book, params.chapter),
    );
    return jsonResponse(result);
  }

  public async getVerse(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(verseParamsSchema, context.params, "verse reference");
    const options = parseOrBadRequest(verseQuerySchema, context.query, "query");
    const result = await this.queryBus.execute<GetVerseQuery, VerseDetailDto>(
      new GetVerseQuery({ ...params, context: options.context }),
    );
    return jsonResponse(result);
  }

  public async search(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(translationParamsSchema, context.params, "translation");
    const options = parseOrBadRequest(searchQuerySchema, context.query, "search query");
    const result = await this.queryBus.execute<SearchVersesQuery, VerseSearchResultDto>(
      new SearchVersesQuery(params.translation, options.q, options.limit),
    );
    return jsonResponse(result);
  }
}
