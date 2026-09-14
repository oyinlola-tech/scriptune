import { randomBytes } from "node:crypto";
import {
  createAuthorizationUrl,
  exchangeCodeForToken,
  fetchUserInfo,
  generateState,
  type FetchLike,
  type OAuthConfig,
  type OAuthUserInfo,
} from "@zudojs/auth-oauth";
import { BadRequestError, ConflictError, UnauthorizedError, UnprocessableEntityError } from "@zudojs/errors";
import type { GoogleOAuthConfig } from "../../configs/index.js";
import { OAUTH_SIGN_IN_TTL_SECONDS } from "../../constants/app.constants.js";
import type { UserModel } from "../../models/index.js";
import type { OAuthSignInRepository, UserRepository } from "../../repositories/index.js";

const PROVIDER = "google";
const SCOPES = ["openid", "email", "profile"] as const;

/**
 * Google sign-in with PKCE. The browser never sees Google tokens: the API
 * completes the exchange, then hands the web app a one-time code that it
 * trades for Scriptune tokens.
 */
export class GoogleSignIn {
  private readonly config: GoogleOAuthConfig;
  private readonly signIns: OAuthSignInRepository;
  private readonly users: UserRepository;
  private readonly oauth: OAuthConfig;

  public constructor(config: GoogleOAuthConfig, signIns: OAuthSignInRepository, users: UserRepository, fetch?: FetchLike) {
    this.config = config;
    this.signIns = signIns;
    this.users = users;
    this.oauth = {
      provider: PROVIDER,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      allowedRedirectUris: [config.redirectUri],
      scopes: [...SCOPES],
      ...(fetch === undefined ? {} : { fetch }),
    };
  }

  public async start(redirectTo: string | null): Promise<{ readonly url: string; readonly state: string }> {
    const state = generateState();
    const authorization = createAuthorizationUrl(this.oauth, { state, redirectUri: this.config.redirectUri });
    await this.signIns.create({
      state,
      provider: PROVIDER,
      codeVerifier: authorization.codeVerifier,
      redirectTo,
      expiresAt: new Date(Date.now() + OAUTH_SIGN_IN_TTL_SECONDS * 1000),
    });
    return { url: authorization.url, state };
  }

  public async complete(state: string, code: string): Promise<{ readonly exchangeCode: string; readonly redirectTo: string | null }> {
    const pending = await this.signIns.findPending(state);
    if (pending === null) {
      throw new BadRequestError("This sign-in has expired. Please try again.");
    }
    const tokens = await exchangeCodeForToken(this.oauth, { code, codeVerifier: pending.codeVerifier, redirectUri: this.config.redirectUri });
    const info = await fetchUserInfo(this.oauth, tokens.accessToken);
    const user = await this.resolveUser(info);
    const exchangeCode = randomBytes(32).toString("base64url");
    await this.signIns.attachExchangeCode(state, exchangeCode, user.id);
    return { exchangeCode, redirectTo: pending.redirectTo };
  }

  public async exchange(exchangeCode: string): Promise<UserModel> {
    const signIn = await this.signIns.consumeExchangeCode(exchangeCode);
    const user = signIn?.userId === null || signIn?.userId === undefined ? null : await this.users.findById(signIn.userId);
    if (user === null || !user.active) {
      throw new UnauthorizedError("This sign-in code is invalid or has already been used.");
    }
    return user;
  }

  private async resolveUser(info: OAuthUserInfo): Promise<UserModel> {
    const linked = await this.users.findByOAuth(PROVIDER, info.providerId);
    if (linked !== null) {
      return linked;
    }
    const email = info.email?.trim().toLowerCase();
    if (email === undefined || email === "") {
      throw new UnprocessableEntityError("Google did not share an email address for this account.");
    }
    const existing = await this.users.findByEmail(email);
    if (existing !== null) {
      if (info.emailVerified !== true) {
        throw new ConflictError("An account with this email already exists. Sign in with your password to link Google.");
      }
      await this.users.linkOAuth(existing.id, { provider: PROVIDER, providerId: info.providerId, email });
      return existing;
    }
    const created = await this.users.create({ email, name: info.name ?? null, avatarUrl: info.avatarUrl ?? null });
    await this.users.linkOAuth(created.id, { provider: PROVIDER, providerId: info.providerId, email });
    return created;
  }
}
