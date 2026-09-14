import type { CommandBus, QueryBus } from "@zudojs/cqrs";
import { ValidationError } from "@zudojs/errors";
import {
  createResponseContext,
  type HttpRouterContext,
  type HttpResponseContext,
} from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import type { AuthSessionDto, TokensDto, UserDto } from "../dtos/index.js";
import { describeError } from "../errors/error.logger.js";
import { requireAuthState } from "../middlewares/auth/authState.helper.js";
import {
  CompleteGoogleSignInCommand,
  ExchangeGoogleSignInCommand,
  LoginUserCommand,
  LogoutSessionCommand,
  RefreshSessionCommand,
  RegisterUserCommand,
  StartGoogleSignInCommand,
  type GoogleSignInCompletionDto,
  type GoogleSignInStartDto,
} from "../modules/identity/commands/index.js";
import { GetCurrentUserQuery } from "../modules/identity/queries/index.js";
import type { SessionContext } from "../services/identity/index.js";
import { hasBody, readJsonBody } from "../utils/http/body.helper.js";
import { jsonResponse } from "../utils/http/response.helper.js";
import { parseOrBadRequest } from "../utils/http/validation.helper.js";
import {
  googleCallbackQuerySchema,
  isCustomSchemeUrl,
  googleExchangeBodySchema,
  googleStartQuerySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "../validators/auth.validators.js";

export interface AuthControllerOptions {
  readonly commandBus: CommandBus;
  readonly queryBus: QueryBus;
  readonly logger: Logger;
  readonly webCallbackUrl: string | null;
  /** The only absolute redirect the start endpoint accepts: the mobile app's deep link. */
  readonly mobileCallbackUrl: string | null;
}

function sessionContext(context: HttpRouterContext): SessionContext {
  const userAgent = context.request.getHeader("user-agent");
  const ip = context.request.remoteAddress;
  return {
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(ip === undefined ? {} : { ip }),
  };
}

/** Translates account and session requests into identity commands. */
export class AuthController {
  private readonly options: AuthControllerOptions;

  public constructor(options: AuthControllerOptions) {
    this.options = options;
  }

  public async register(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const body = parseOrBadRequest(
      registerBodySchema,
      readJsonBody(context.request),
      "registration",
    );
    const session = await this.options.commandBus.execute<
      RegisterUserCommand,
      AuthSessionDto
    >(new RegisterUserCommand({ ...body, context: sessionContext(context) }));
    return jsonResponse(session, 201);
  }

  public async login(context: HttpRouterContext): Promise<HttpResponseContext> {
    const body = parseOrBadRequest(
      loginBodySchema,
      readJsonBody(context.request),
      "credentials",
    );
    return jsonResponse(
      await this.options.commandBus.execute<LoginUserCommand, AuthSessionDto>(
        new LoginUserCommand({ ...body, context: sessionContext(context) }),
      ),
    );
  }

  public async refresh(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const body = parseOrBadRequest(
      refreshBodySchema,
      readJsonBody(context.request),
      "refresh token",
    );
    return jsonResponse({
      tokens: await this.options.commandBus.execute<
        RefreshSessionCommand,
        TokensDto
      >(new RefreshSessionCommand(body.refreshToken)),
    });
  }

  public async logout(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const auth = requireAuthState(context.request);
    const body = hasBody(context.request)
      ? parseOrBadRequest(
          logoutBodySchema,
          readJsonBody(context.request),
          "logout",
        )
      : {};
    await this.options.commandBus.execute<LogoutSessionCommand, void>(
      new LogoutSessionCommand({
        userId: auth.userId,
        sessionId: auth.sessionId,
        ...body,
      }),
    );
    return createResponseContext().setStatus(204);
  }

  public async me(context: HttpRouterContext): Promise<HttpResponseContext> {
    const auth = requireAuthState(context.request);
    return jsonResponse({
      user: await this.options.queryBus.execute<GetCurrentUserQuery, UserDto>(
        new GetCurrentUserQuery(auth.userId),
      ),
    });
  }

  public async googleStart(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const query = parseOrBadRequest(
      googleStartQuerySchema,
      context.query,
      "query",
    );
    if (
      query.redirect !== undefined &&
      isCustomSchemeUrl(query.redirect) &&
      this.options.mobileCallbackUrl !== null &&
      query.redirect !== this.options.mobileCallbackUrl
    ) {
      throw new ValidationError(
        "Redirect must be a path or the registered app deep link.",
      );
    }
    const { url } = await this.options.commandBus.execute<
      StartGoogleSignInCommand,
      GoogleSignInStartDto
    >(new StartGoogleSignInCommand(query.redirect ?? null));
    return createResponseContext().redirect(url, 302);
  }

  public async googleCallback(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const query = parseOrBadRequest(
      googleCallbackQuerySchema,
      context.query,
      "callback",
    );
    if (
      query.error !== undefined ||
      query.code === undefined ||
      query.state === undefined
    ) {
      return this.webRedirect({ error: query.error ?? "missing_code" });
    }
    try {
      const completion = await this.options.commandBus.execute<
        CompleteGoogleSignInCommand,
        GoogleSignInCompletionDto
      >(new CompleteGoogleSignInCommand(query.state, query.code));
      if (
        completion.redirectTo !== null &&
        isCustomSchemeUrl(completion.redirectTo)
      ) {
        return this.redirectWithParams(completion.redirectTo, {
          code: completion.exchangeCode,
        });
      }
      return this.webRedirect({
        code: completion.exchangeCode,
        ...(completion.redirectTo === null
          ? {}
          : { redirect: completion.redirectTo }),
      });
    } catch (error) {
      this.options.logger.warn("Google sign-in failed", {
        error: describeError(error),
      });
      return this.webRedirect({ error: "sign_in_failed" });
    }
  }

  public async googleExchange(
    context: HttpRouterContext,
  ): Promise<HttpResponseContext> {
    const body = parseOrBadRequest(
      googleExchangeBodySchema,
      readJsonBody(context.request),
      "exchange",
    );
    return jsonResponse(
      await this.options.commandBus.execute<
        ExchangeGoogleSignInCommand,
        AuthSessionDto
      >(new ExchangeGoogleSignInCommand(body.code, sessionContext(context))),
    );
  }

  private webRedirect(
    params: Readonly<Record<string, string>>,
  ): HttpResponseContext {
    return this.redirectWithParams(this.options.webCallbackUrl ?? "/", params);
  }

  private redirectWithParams(
    target: string,
    params: Readonly<Record<string, string>>,
  ): HttpResponseContext {
    const url = new URL(target);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return createResponseContext().redirect(url.toString(), 302);
  }
}
