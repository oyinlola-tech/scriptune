import type { CommandBus, QueryBus } from "@zudojs/cqrs";
import { createResponseContext, type HttpRouterContext, type HttpResponseContext } from "@zudojs/http";
import type { HistoryEntryDto, NoteDto, SavedItemDto } from "../../dtos/index.js";
import { requireAuthState } from "../../middlewares/auth/authState.helper.js";
import {
  AddHistoryCommand, ClearHistoryCommand, DeleteNoteCommand, SaveItemCommand, UnsaveItemCommand, UpsertNoteCommand,
  type AddHistoryResult,
} from "../../modules/library/commands/index.js";
import { ListHistoryQuery, ListNotesQuery, ListSavedItemsQuery } from "../../modules/library/queries/index.js";
import type { HistoryEntryInput } from "../../repositories/index.js";
import { toLibraryTarget, toTargetTypeName } from "../../services/library/index.js";
import { readJsonBody } from "../../utils/http/body.helper.js";
import { jsonResponse } from "../../utils/http/response.helper.js";
import { parseOrBadRequest } from "../../utils/http/validation.helper.js";
import {
  historyEntrySchema, historyImportBodySchema, historyQuerySchema, noteBodySchema, savedQuerySchema, targetBodySchema, targetParamsSchema,
  type HistoryEntryBody,
} from "../../validators/library.validators.js";

function toHistoryInput(entry: HistoryEntryBody): HistoryEntryInput {
  const target = entry.type !== undefined && entry.key !== undefined ? toLibraryTarget(entry.type, entry.key) : null;
  return {
    kind: entry.kind.toUpperCase() as HistoryEntryInput["kind"],
    mode: entry.mode ?? null,
    query: entry.query,
    targetType: target?.targetType ?? null,
    targetKey: target?.targetKey ?? null,
    attemptId: entry.attemptId ?? null,
    occurredAt: entry.occurredAt === undefined ? new Date() : new Date(entry.occurredAt),
  };
}

/** Saved items, notes and history for the signed-in member. */
export class LibraryController {
  private readonly commandBus: CommandBus;
  private readonly queryBus: QueryBus;

  public constructor(commandBus: CommandBus, queryBus: QueryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  public async listSaved(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const query = parseOrBadRequest(savedQuerySchema, context.query, "query");
    const items = await this.queryBus.execute<ListSavedItemsQuery, readonly SavedItemDto[]>(
      new ListSavedItemsQuery(userId, query.type === undefined ? undefined : toTargetTypeName(query.type)),
    );
    return jsonResponse({ items });
  }

  public async save(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const body = parseOrBadRequest(targetBodySchema, readJsonBody(context.request), "body");
    const item = await this.commandBus.execute<SaveItemCommand, SavedItemDto>(new SaveItemCommand(userId, toLibraryTarget(body.type, body.key)));
    return jsonResponse(item, 201);
  }

  public async unsave(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(targetParamsSchema, context.params, "target");
    await this.commandBus.execute<UnsaveItemCommand, boolean>(new UnsaveItemCommand(userId, toLibraryTarget(params.type, params.key)));
    return createResponseContext().setStatus(204);
  }

  public async listNotes(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    return jsonResponse({ notes: await this.queryBus.execute<ListNotesQuery, readonly NoteDto[]>(new ListNotesQuery(userId)) });
  }

  public async putNote(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(targetParamsSchema, context.params, "target");
    const body = parseOrBadRequest(noteBodySchema, readJsonBody(context.request), "note");
    return jsonResponse(await this.commandBus.execute<UpsertNoteCommand, NoteDto>(new UpsertNoteCommand(userId, toLibraryTarget(params.type, params.key), body.body)));
  }

  public async deleteNote(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const params = parseOrBadRequest(targetParamsSchema, context.params, "target");
    await this.commandBus.execute<DeleteNoteCommand, boolean>(new DeleteNoteCommand(userId, toLibraryTarget(params.type, params.key)));
    return createResponseContext().setStatus(204);
  }

  public async listHistory(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const query = parseOrBadRequest(historyQuerySchema, context.query, "query");
    return jsonResponse({ entries: await this.queryBus.execute<ListHistoryQuery, readonly HistoryEntryDto[]>(new ListHistoryQuery(userId, query.limit)) });
  }

  public async addHistory(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const body = parseOrBadRequest(historyEntrySchema, readJsonBody(context.request), "history entry");
    return jsonResponse(await this.commandBus.execute<AddHistoryCommand, AddHistoryResult>(new AddHistoryCommand(userId, [toHistoryInput(body)])), 201);
  }

  public async importHistory(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    const body = parseOrBadRequest(historyImportBodySchema, readJsonBody(context.request), "history import");
    return jsonResponse(await this.commandBus.execute<AddHistoryCommand, AddHistoryResult>(new AddHistoryCommand(userId, body.entries.map(toHistoryInput))), 201);
  }

  public async clearHistory(context: HttpRouterContext): Promise<HttpResponseContext> {
    const { userId } = requireAuthState(context.request);
    await this.commandBus.execute<ClearHistoryCommand, number>(new ClearHistoryCommand(userId));
    return createResponseContext().setStatus(204);
  }
}
