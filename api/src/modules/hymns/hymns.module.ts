import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { HymnsController } from "../../controllers/index.js";
import {
  PrismaHymnalRepository,
  PrismaHymnImportRepository,
  PrismaHymnLinkRepository,
  PrismaHymnRepository,
  PrismaHymnTextRepository,
  PrismaSourceRepository,
} from "../../repositories/index.js";
import { createHymnRoutes } from "../../routes/index.js";
import { HymnLookup } from "../../services/hymns/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import { IMPORT_HYMNAL, ImportHymnalHandler, LINK_SCRIPTURES, LinkScripturesHandler, RELATE_HYMNS, RelateHymnsHandler } from "./commands/index.js";
import {
  GET_HYMN,
  GET_RELATED_HYMNS,
  EXPORT_HYMNAL,
  ExportHymnalHandler,
  GET_HYMNAL,
  GET_HYMNAL_ENTRY,
  GET_HYMN_SUMMARIES,
  GetHymnalEntryHandler,
  GetHymnalHandler,
  GetHymnHandler,
  GetRelatedHymnsHandler,
  GetHymnSummariesHandler,
  LIST_HYMNALS,
  LIST_HYMNS,
  LIST_HYMNS_FOR_VERSE,
  LIST_TOPICS,
  ListHymnalsHandler,
  ListHymnsForVerseHandler,
  ListHymnsHandler,
  ListTopicsHandler,
  SEARCH_HYMNS,
  SearchHymnsHandler,
} from "./queries/index.js";

export interface HymnsModuleOptions {
  /** Set to false for headless runs (imports) where no HTTP module is loaded. */
  readonly http?: boolean;
}

/**
 * Hymns, their texts, hymnals, topics and the links to scripture.
 *
 * Registers its handlers on the buses and, when HTTP is present, its routes
 * on the shared router.
 */
export class HymnsModule extends BaseModule {
  public readonly id = "hymns";
  public readonly name = "Hymns";

  private readonly container: Container;
  private readonly http: boolean;

  public constructor(container: Container, options: HymnsModuleOptions = {}) {
    const http = options.http ?? true;
    super({ version: APP_VERSION, dependencies: http ? ["database", "http"] : ["database"] });
    this.container = container;
    this.http = http;
  }

  public override async onInitialize(): Promise<void> {
    const prisma = this.container.resolve(TOKENS.prismaClient);
    const commandBus = this.container.resolve(TOKENS.commandBus);
    const queryBus = this.container.resolve(TOKENS.queryBus);

    const sources = new PrismaSourceRepository(prisma);
    const hymnals = new PrismaHymnalRepository(prisma);
    const hymns = new PrismaHymnRepository(prisma);
    const hymnImports = new PrismaHymnImportRepository(prisma);
    const texts = new PrismaHymnTextRepository(prisma);
    const links = new PrismaHymnLinkRepository(prisma);
    const lookup = new HymnLookup(hymns, hymnals);

    commandBus.register(IMPORT_HYMNAL, new ImportHymnalHandler(sources, hymnals, hymnImports));
    commandBus.register(LINK_SCRIPTURES, new LinkScripturesHandler(links));
    commandBus.register(RELATE_HYMNS, new RelateHymnsHandler(links));
    queryBus.register(GET_HYMN, new GetHymnHandler(lookup));
    queryBus.register(GET_RELATED_HYMNS, new GetRelatedHymnsHandler(lookup, links));
    queryBus.register(GET_HYMN_SUMMARIES, new GetHymnSummariesHandler(hymns));
    queryBus.register(LIST_HYMNS, new ListHymnsHandler(hymns));
    queryBus.register(SEARCH_HYMNS, new SearchHymnsHandler(texts));
    queryBus.register(LIST_HYMNALS, new ListHymnalsHandler(hymnals));
    queryBus.register(GET_HYMNAL, new GetHymnalHandler(lookup, hymnals));
    queryBus.register(EXPORT_HYMNAL, new ExportHymnalHandler(lookup, hymnals));
    queryBus.register(GET_HYMNAL_ENTRY, new GetHymnalEntryHandler(lookup, hymnals));
    queryBus.register(LIST_TOPICS, new ListTopicsHandler(links));
    queryBus.register(LIST_HYMNS_FOR_VERSE, new ListHymnsForVerseHandler(links));

    if (this.http) {
      const router = this.container.resolve(TOKENS.httpRouter);
      const openapi = this.container.resolve(TOKENS.openApi);
      registerRoutes(router, openapi, createHymnRoutes(new HymnsController(queryBus)));
    }
  }
}
