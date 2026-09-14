import type { CommandBus, QueryBus } from "@zudojs/cqrs";
import { createResponseContext, type HttpRouterContext, type HttpResponseContext } from "@zudojs/http";
import type { CollectionDetailDto, CollectionDto, CollectionItemDto } from "../../dtos/index.js";
import { requireAuthState } from "../../middlewares/auth/authState.helper.js";
import {
  AddCollectionItemCommand, CreateCollectionCommand, DeleteCollectionCommand, RemoveCollectionItemCommand, UpdateCollectionCommand,
} from "../../modules/library/commands/index.js";
import { GetCollectionQuery, ListCollectionsQuery } from "../../modules/library/queries/index.js";
import { toLibraryTarget } from "../../services/library/index.js";
import { readJsonBody } from "../../utils/http/body.helper.js";
import { jsonResponse } from "../../utils/http/response.helper.js";
import { parseOrBadRequest } from "../../utils/http/validation.helper.js";
import { collectionBodySchema, collectionItemBodySchema, collectionParamsSchema, collectionUpdateSchema, targetParamsSchema } from "../../validators/library.validators.js";

const itemParamsSchema = collectionParamsSchema.extend(targetParamsSchema.shape);

/** Collections of hymns and verses for the signed-in member. */
export class CollectionsController {
  private readonly commandBus: CommandBus;
  private readonly queryBus: QueryBus;

  public constructor(commandBus: CommandBus, queryBus: QueryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  public async list(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    return jsonResponse({ collections: await this.queryBus.execute<ListCollectionsQuery, readonly CollectionDto[]>(new ListCollectionsQuery(userId)) });
  }

  public async create(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const body = parseOrBadRequest(collectionBodySchema, readJsonBody(context.request), "collection");
    return jsonResponse(await this.commandBus.execute<CreateCollectionCommand, CollectionDto>(new CreateCollectionCommand({ userId, ...body })), 201);
  }

  public async get(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(collectionParamsSchema, context.params, "collection");
    return jsonResponse(await this.queryBus.execute<GetCollectionQuery, CollectionDetailDto>(new GetCollectionQuery(userId, params.slug)));
  }

  public async update(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(collectionParamsSchema, context.params, "collection");
    const body = parseOrBadRequest(collectionUpdateSchema, readJsonBody(context.request), "collection");
    return jsonResponse(await this.commandBus.execute<UpdateCollectionCommand, CollectionDto>(new UpdateCollectionCommand({ userId, slug: params.slug, ...body })));
  }

  public async remove(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(collectionParamsSchema, context.params, "collection");
    await this.commandBus.execute<DeleteCollectionCommand, void>(new DeleteCollectionCommand(userId, params.slug));
    return createResponseContext().setStatus(204);
  }

  public async addItem(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(collectionParamsSchema, context.params, "collection");
    const body = parseOrBadRequest(collectionItemBodySchema, readJsonBody(context.request), "item");
    const item = await this.commandBus.execute<AddCollectionItemCommand, CollectionItemDto>(
      new AddCollectionItemCommand({ userId, slug: params.slug, target: toLibraryTarget(body.type, body.key), note: body.note ?? null }),
    );
    return jsonResponse(item, 201);
  }

  public async removeItem(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(itemParamsSchema, context.params, "collection item");
    await this.commandBus.execute<RemoveCollectionItemCommand, boolean>(
      new RemoveCollectionItemCommand(userId, params.slug, toLibraryTarget(params.type, params.key)),
    );
    return createResponseContext().setStatus(204);
  }
}
