import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, AUTH_RATE_LIMIT_MAX, TOKENS } from "../../constants/index.js";
import { AccountController, AuthController } from "../../controllers/index.js";
import { createAuthenticateMiddleware, createRateLimitMiddleware, createRequireAuthMiddleware, type RateLimitMiddleware } from "../../middlewares/index.js";
import { PrismaOAuthSignInRepository, PrismaRecognitionAttemptRepository, PrismaSessionStore, PrismaTokenRevocationStore, PrismaUserRepository } from "../../repositories/index.js";
import { createAuthRoutes } from "../../routes/index.js";
import { createAppAuth, GoogleSignIn, SessionIssuer } from "../../services/identity/index.js";
import { registerRoutes } from "../../utils/http/route.helper.js";
import {
  COMPLETE_GOOGLE_SIGN_IN,
  CompleteGoogleSignInHandler,
  EXCHANGE_GOOGLE_SIGN_IN,
  ExchangeGoogleSignInHandler,
  LOGIN_USER,
  LoginUserHandler,
  DELETE_ACCOUNT,
  DeleteAccountHandler,
  LOGOUT_SESSION,
  LogoutSessionHandler,
  REFRESH_SESSION,
  RefreshSessionHandler,
  REGISTER_USER,
  RegisterUserHandler,
  START_GOOGLE_SIGN_IN,
  StartGoogleSignInHandler,
} from "./commands/index.js";
import { GET_CURRENT_USER, GetCurrentUserHandler } from "./queries/index.js";

/**
 * Accounts, sessions and tokens. Exposes the auth service and user
 * repository through the container so other modules can authenticate.
 */
export class IdentityModule extends BaseModule {
  public readonly id = "identity";
  public readonly name = "Identity";

  private readonly container: Container;
  private rateLimit: RateLimitMiddleware | undefined;

  public constructor(container: Container) {
    super({ version: APP_VERSION, dependencies: ["database", "http"] });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const prisma = this.container.resolve(TOKENS.prismaClient);
    const commandBus = this.container.resolve(TOKENS.commandBus);
    const queryBus = this.container.resolve(TOKENS.queryBus);
    const logger = this.container.resolve(TOKENS.logger).child({ name: "identity" });

    const users = new PrismaUserRepository(prisma);
    const sessionStore = new PrismaSessionStore(prisma, config.auth.sessionTtlSeconds);
    const auth = createAppAuth({ config: config.auth, users, sessionStore, revocationStore: new PrismaTokenRevocationStore(prisma) });
    const issuer = new SessionIssuer(auth.tokenConfig, sessionStore, users);
    const google = config.google === null ? null : new GoogleSignIn(config.google, new PrismaOAuthSignInRepository(prisma), users);
    this.container.registerValue(TOKENS.authService, auth.service);
    this.container.registerValue(TOKENS.userRepository, users);

    commandBus.register(REGISTER_USER, new RegisterUserHandler(users, auth.service, issuer));
    commandBus.register(LOGIN_USER, new LoginUserHandler(auth.service, users));
    commandBus.register(REFRESH_SESSION, new RefreshSessionHandler(auth.service));
    commandBus.register(LOGOUT_SESSION, new LogoutSessionHandler(auth.service));
    commandBus.register(DELETE_ACCOUNT, new DeleteAccountHandler(auth.service, users, new PrismaRecognitionAttemptRepository(prisma)));
    commandBus.register(START_GOOGLE_SIGN_IN, new StartGoogleSignInHandler(google));
    commandBus.register(COMPLETE_GOOGLE_SIGN_IN, new CompleteGoogleSignInHandler(google));
    commandBus.register(EXCHANGE_GOOGLE_SIGN_IN, new ExchangeGoogleSignInHandler(google, issuer));
    queryBus.register(GET_CURRENT_USER, new GetCurrentUserHandler(users));

    this.rateLimit = createRateLimitMiddleware({ max: AUTH_RATE_LIMIT_MAX, windowMs: 60_000 });
    const controller = new AuthController({ commandBus, queryBus, logger, webCallbackUrl: config.google?.webCallbackUrl ?? null, mobileCallbackUrl: config.google?.mobileCallbackUrl ?? null });
    registerRoutes(
      this.container.resolve(TOKENS.httpRouter),
      this.container.resolve(TOKENS.openApi),
      createAuthRoutes(controller, new AccountController(commandBus), {
        rateLimit: this.rateLimit.middleware,
        authenticate: createAuthenticateMiddleware(auth.service),
        requireAuth: createRequireAuthMiddleware(),
      }),
    );
    logger.info("Identity ready", { google: google !== null });
  }

  public override async onShutdown(): Promise<void> {
    this.rateLimit?.dispose();
    this.rateLimit = undefined;
  }
}
