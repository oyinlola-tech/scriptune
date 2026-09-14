import { jwt, toUserId, type SessionStore, type TokenConfig, type TokenPair } from "@zudojs/auth";
import type { UserModel } from "../../models/index.js";
import type { UserRepository } from "../../repositories/index.js";

export interface IssuedSession {
  readonly user: UserModel;
  readonly tokens: TokenPair;
  readonly sessionId: string;
}

export interface SessionContext {
  readonly userAgent?: string;
  readonly ip?: string;
}

/**
 * Opens a session and mints tokens for a user that has already proven who
 * they are: a fresh registration or a completed Google sign-in.
 */
export class SessionIssuer {
  private readonly tokenConfig: TokenConfig;
  private readonly sessions: SessionStore;
  private readonly users: UserRepository;

  public constructor(tokenConfig: TokenConfig, sessions: SessionStore, users: UserRepository) {
    this.tokenConfig = tokenConfig;
    this.sessions = sessions;
    this.users = users;
  }

  public async issue(user: UserModel, context: SessionContext = {}): Promise<IssuedSession> {
    const userId = toUserId(user.id);
    const session = await this.sessions.create({
      userId,
      ...(context.userAgent === undefined ? {} : { userAgent: context.userAgent }),
      ...(context.ip === undefined ? {} : { ip: context.ip }),
    });
    const tokens = jwt.createTokenPair(userId, this.tokenConfig, { roles: user.roles, sessionId: session.id });
    await this.users.touchLogin(user.id);
    return { user, tokens, sessionId: session.id };
  }
}
