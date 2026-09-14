import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { RecognitionController } from "../../controllers/index.js";
import { createAuthenticateMiddleware, createRateLimitMiddleware, type RateLimitMiddleware } from "../../middlewares/index.js";
import { PrismaRecognitionAttemptRepository } from "../../repositories/index.js";
import { createRecognitionRoutes } from "../../routes/index.js";
import { RecognitionEngine } from "../../services/recognition/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import { RECOGNIZE_AUDIO, RECOGNIZE_TEXT, RecognizeAudioHandler, RecognizeTextHandler } from "./commands/index.js";
import { GET_ATTEMPT, GetAttemptHandler } from "./queries/index.js";

/**
 * Identifies what someone heard. Depends on transcription for audio and on
 * the bible and hymn searches, reached through the query bus.
 */
export class RecognitionModule extends BaseModule {
  public readonly id = "recognition";
  public readonly name = "Recognition";

  private readonly container: Container;
  private rateLimit: RateLimitMiddleware | undefined;

  public constructor(container: Container) {
    super({ version: APP_VERSION, dependencies: ["http", "database", "bible", "hymns", "transcription", "identity"] });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const commandBus = this.container.resolve(TOKENS.commandBus);
    const queryBus = this.container.resolve(TOKENS.queryBus);
    const prisma = this.container.resolve(TOKENS.prismaClient);

    const attempts = new PrismaRecognitionAttemptRepository(prisma);
    const engine = new RecognitionEngine({ queryBus, defaultTranslation: config.recognition.defaultTranslation });
    const textHandler = new RecognizeTextHandler(engine, attempts);
    commandBus.register(RECOGNIZE_TEXT, textHandler);
    commandBus.register(RECOGNIZE_AUDIO, new RecognizeAudioHandler(commandBus, textHandler));
    queryBus.register(GET_ATTEMPT, new GetAttemptHandler(attempts));

    this.rateLimit = createRateLimitMiddleware({ max: config.recognition.rateLimitMax, windowMs: 60_000 });
    registerRoutes(
      this.container.resolve(TOKENS.httpRouter),
      this.container.resolve(TOKENS.openApi),
      createRecognitionRoutes(new RecognitionController(commandBus, queryBus), {
        rateLimit: this.rateLimit.middleware,
        authenticate: createAuthenticateMiddleware(this.container.resolve(TOKENS.authService)),
      }),
    );
  }

  public override async onShutdown(): Promise<void> {
    this.rateLimit?.dispose();
    this.rateLimit = undefined;
  }
}
