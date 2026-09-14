import {
  createAuthService,
  createMemoryLoginAttemptStore,
  toUserId,
  verifyPassword,
  type AuthService,
  type AuthUser,
  type SessionStore,
  type TokenConfig,
  type TokenRevocationStore,
} from "@zudojs/auth";
import type { AuthConfig } from "../../configs/index.js";
import type { UserModel } from "../../models/index.js";
import type { UserRepository } from "../../repositories/index.js";

export interface AppAuth {
  readonly service: AuthService;
  readonly tokenConfig: TokenConfig;
}

export interface AppAuthDependencies {
  readonly config: AuthConfig;
  readonly users: UserRepository;
  readonly sessionStore: SessionStore;
  readonly revocationStore: TokenRevocationStore;
}

/** Maps a stored user to the shape the framework's auth service reads. */
export function toAuthUser(user: UserModel): AuthUser {
  return {
    id: toUserId(user.id),
    email: user.email,
    ...(user.name === null ? {} : { name: user.name }),
    roles: user.roles,
    active: user.active,
    createdAt: user.createdAt,
    ...(user.lastLoginAt === null ? {} : { lastLoginAt: user.lastLoginAt }),
  };
}

/** Builds the framework auth service over the Postgres-backed stores. */
export function createAppAuth(dependencies: AppAuthDependencies): AppAuth {
  const { config, users, sessionStore, revocationStore } = dependencies;
  const tokenConfig: TokenConfig = {
    accessSecret: config.accessSecret,
    refreshSecret: config.refreshSecret,
    accessTtl: config.accessTtlSeconds,
    refreshTtl: config.refreshTtlSeconds,
    issuer: config.issuer,
    audience: config.audience,
  };
  const service = createAuthService({
    token: tokenConfig,
    sessionStore,
    revocationStore,
    sessionTtlSeconds: config.sessionTtlSeconds,
    findUser: async (identifier) => {
      const user = await users.findByEmail(identifier);
      return user === null ? null : toAuthUser(user);
    },
    findUserById: async (userId) => {
      const user = await users.findById(userId);
      return user === null ? null : toAuthUser(user);
    },
    verifyPassword: async (userId, password) => {
      const hash = await users.findPasswordHash(userId);
      return hash === null ? false : verifyPassword(password, hash);
    },
    loginThrottle: { store: createMemoryLoginAttemptStore() },
  });
  return { service, tokenConfig };
}
