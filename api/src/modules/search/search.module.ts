import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { SearchController } from "../../controllers/index.js";
import { createSearchRoutes } from "../../routes/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import { SEARCH_ALL, SearchAllHandler } from "./queries/index.js";

/** Unified search across the Bible and hymn corpora. */
export class SearchModule extends BaseModule {
  public readonly id = "search";
  public readonly name = "Search";

  private readonly container: Container;

  public constructor(container: Container) {
    super({ version: APP_VERSION, dependencies: ["http", "bible", "hymns"] });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const queryBus = this.container.resolve(TOKENS.queryBus);
    queryBus.register(SEARCH_ALL, new SearchAllHandler(queryBus, config.recognition.defaultTranslation));
    registerRoutes(
      this.container.resolve(TOKENS.httpRouter),
      this.container.resolve(TOKENS.openApi),
      createSearchRoutes(new SearchController(queryBus)),
    );
  }
}
