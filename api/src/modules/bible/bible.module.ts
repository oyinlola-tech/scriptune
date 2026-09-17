import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { BibleController } from "../../controllers/index.js";
import {
  PrismaBookRepository,
  PrismaCrossReferenceRepository,
  PrismaTranslationRepository,
  PrismaVerseRepository,
} from "../../repositories/index.js";
import { createBibleRoutes } from "../../routes/index.js";
import { BibleLookup } from "../../services/bible/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import { IMPORT_CROSS_REFERENCES, IMPORT_TRANSLATION, ImportCrossReferencesHandler, ImportTranslationHandler } from "./commands/index.js";
import {
  EXPORT_TRANSLATION,
  ExportTranslationHandler,
  GET_CHAPTER,
  GET_CROSS_REFERENCES,
  GET_VERSE,
  GET_VERSES_BY_KEYS,
  GetChapterHandler,
  GetCrossReferencesHandler,
  GetVerseHandler,
  GetVersesByKeysHandler,
  LIST_BOOKS,
  LIST_TRANSLATIONS,
  ListBooksHandler,
  ListTranslationsHandler,
  SEARCH_VERSES,
  SearchVersesHandler,
} from "./queries/index.js";

export interface BibleModuleOptions {
  /** Set to false for headless runs (imports) where no HTTP module is loaded. */
  readonly http?: boolean;
}

/**
 * Translations, books, verses, verse search and cross-references.
 *
 * Registers its handlers on the buses and, when HTTP is present, its routes
 * on the shared router.
 */
export class BibleModule extends BaseModule {
  public readonly id = "bible";
  public readonly name = "Bible";

  private readonly container: Container;
  private readonly http: boolean;

  public constructor(container: Container, options: BibleModuleOptions = {}) {
    const http = options.http ?? true;
    super({ version: APP_VERSION, dependencies: http ? ["database", "http"] : ["database"] });
    this.container = container;
    this.http = http;
  }

  public override async onInitialize(): Promise<void> {
    const prisma = this.container.resolve(TOKENS.prismaClient);
    const commandBus = this.container.resolve(TOKENS.commandBus);
    const queryBus = this.container.resolve(TOKENS.queryBus);

    const translations = new PrismaTranslationRepository(prisma);
    const books = new PrismaBookRepository(prisma);
    const verses = new PrismaVerseRepository(prisma);
    const crossReferences = new PrismaCrossReferenceRepository(prisma);
    const lookup = new BibleLookup(translations, books);

    commandBus.register(IMPORT_TRANSLATION, new ImportTranslationHandler(translations, books, verses));
    commandBus.register(IMPORT_CROSS_REFERENCES, new ImportCrossReferencesHandler(crossReferences));
    queryBus.register(LIST_TRANSLATIONS, new ListTranslationsHandler(translations));
    queryBus.register(LIST_BOOKS, new ListBooksHandler(lookup, books));
    queryBus.register(GET_CHAPTER, new GetChapterHandler(lookup, verses));
    queryBus.register(GET_VERSE, new GetVerseHandler(lookup, verses));
    queryBus.register(GET_CROSS_REFERENCES, new GetCrossReferencesHandler(lookup, books, crossReferences));
    queryBus.register(GET_VERSES_BY_KEYS, new GetVersesByKeysHandler(translations, books, verses));
    queryBus.register(SEARCH_VERSES, new SearchVersesHandler(lookup, translations, books, verses));
    queryBus.register(EXPORT_TRANSLATION, new ExportTranslationHandler(lookup, books, verses));

    if (this.http) {
      const router = this.container.resolve(TOKENS.httpRouter);
      const openapi = this.container.resolve(TOKENS.openApi);
      registerRoutes(router, openapi, createBibleRoutes(new BibleController(queryBus)));
    }
  }
}
