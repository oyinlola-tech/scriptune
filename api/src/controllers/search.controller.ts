import type { QueryBus } from "@zudojs/cqrs";
import type { HttpRouterContext, HttpResponseContext } from "@zudojs/http";
import { SearchAllQuery, type SearchAllResultDto } from "../modules/search/queries/index.js";
import { jsonResponse } from "../utils/http/response.helper.js";
import { parseOrBadRequest } from "../utils/http/validation.helper.js";
import { searchAllQuerySchema } from "../validators/recognition.validators.js";

/** Translates unified search requests into the search query. */
export class SearchController {
  private readonly queryBus: QueryBus;

  public constructor(queryBus: QueryBus) {
    this.queryBus = queryBus;
  }

  public async search(context: HttpRouterContext): Promise<HttpResponseContext> {
    const options = parseOrBadRequest(searchAllQuerySchema, context.query, "search query");
    const result = await this.queryBus.execute<SearchAllQuery, SearchAllResultDto>(
      new SearchAllQuery({
        text: options.q,
        scope: options.type,
        limit: options.limit,
        ...(options.translation === undefined ? {} : { translation: options.translation }),
        ...(options.language === undefined ? {} : { language: options.language }),
      }),
    );
    return jsonResponse(result);
  }
}
