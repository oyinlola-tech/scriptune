import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { CollectionsController, LibraryController } from "../../controllers/index.js";
import { createAuthenticateMiddleware, createRequireAuthMiddleware } from "../../middlewares/index.js";
import { PrismaCollectionRepository, PrismaHistoryRepository, PrismaNoteRepository, PrismaSavedItemRepository } from "../../repositories/index.js";
import { createCollectionRoutes, createLibraryRoutes } from "../../routes/index.js";
import { LibraryTargetResolver } from "../../services/library/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import {
  ADD_COLLECTION_ITEM, ADD_HISTORY, AddCollectionItemHandler, AddHistoryHandler,
  CLEAR_HISTORY, ClearHistoryHandler, CREATE_COLLECTION, CreateCollectionHandler,
  DELETE_COLLECTION, DELETE_NOTE, DeleteCollectionHandler, DeleteNoteHandler,
  REMOVE_COLLECTION_ITEM, RemoveCollectionItemHandler, SAVE_ITEM, SaveItemHandler,
  UNSAVE_ITEM, UnsaveItemHandler, UPDATE_COLLECTION, UpdateCollectionHandler,
  UPSERT_NOTE, UpsertNoteHandler,
} from "./commands/index.js";
import {
  GET_COLLECTION, GetCollectionHandler, LIST_COLLECTIONS, LIST_HISTORY, LIST_NOTES, LIST_SAVED_ITEMS,
  ListCollectionsHandler, ListHistoryHandler, ListNotesHandler, ListSavedItemsHandler,
} from "./queries/index.js";

/**
 * Everything a signed-in member keeps: saved hymns and verses, collections,
 * notes and history. Every route requires a bearer token.
 */
export class LibraryModule extends BaseModule {
  public readonly id = "library";
  public readonly name = "Library";

  private readonly container: Container;

  public constructor(container: Container) {
    super({ version: APP_VERSION, dependencies: ["database", "http", "identity", "bible", "hymns"] });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const prisma = this.container.resolve(TOKENS.prismaClient);
    const commandBus = this.container.resolve(TOKENS.commandBus);
    const queryBus = this.container.resolve(TOKENS.queryBus);

    const saved = new PrismaSavedItemRepository(prisma);
    const collections = new PrismaCollectionRepository(prisma);
    const notes = new PrismaNoteRepository(prisma);
    const history = new PrismaHistoryRepository(prisma);
    const resolver = new LibraryTargetResolver(queryBus);

    commandBus.register(SAVE_ITEM, new SaveItemHandler(saved, resolver));
    commandBus.register(UNSAVE_ITEM, new UnsaveItemHandler(saved));
    commandBus.register(CREATE_COLLECTION, new CreateCollectionHandler(collections));
    commandBus.register(UPDATE_COLLECTION, new UpdateCollectionHandler(collections));
    commandBus.register(DELETE_COLLECTION, new DeleteCollectionHandler(collections));
    commandBus.register(ADD_COLLECTION_ITEM, new AddCollectionItemHandler(collections, resolver));
    commandBus.register(REMOVE_COLLECTION_ITEM, new RemoveCollectionItemHandler(collections));
    commandBus.register(UPSERT_NOTE, new UpsertNoteHandler(notes, resolver));
    commandBus.register(DELETE_NOTE, new DeleteNoteHandler(notes));
    commandBus.register(ADD_HISTORY, new AddHistoryHandler(history));
    commandBus.register(CLEAR_HISTORY, new ClearHistoryHandler(history));
    queryBus.register(LIST_SAVED_ITEMS, new ListSavedItemsHandler(saved, resolver));
    queryBus.register(LIST_COLLECTIONS, new ListCollectionsHandler(collections));
    queryBus.register(GET_COLLECTION, new GetCollectionHandler(collections, resolver));
    queryBus.register(LIST_NOTES, new ListNotesHandler(notes, resolver));
    queryBus.register(LIST_HISTORY, new ListHistoryHandler(history, resolver));

    const guard = [createAuthenticateMiddleware(this.container.resolve(TOKENS.authService)), createRequireAuthMiddleware()];
    const router = this.container.resolve(TOKENS.httpRouter);
    const openapi = this.container.resolve(TOKENS.openApi);
    registerRoutes(router, openapi, [
      ...createLibraryRoutes(new LibraryController(commandBus, queryBus), guard),
      ...createCollectionRoutes(new CollectionsController(commandBus, queryBus), guard),
    ]);
  }
}
