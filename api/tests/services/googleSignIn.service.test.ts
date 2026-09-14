import { describe, expect, it } from "vitest";
import type { FetchLike } from "@zudojs/auth-oauth";
import type { OAuthSignInModel, UserModel } from "../../src/models/index.js";
import type { CreateOAuthSignInInput, CreateUserInput, OAuthLink, OAuthSignInRepository, UserRepository } from "../../src/repositories/index.js";
import { GoogleSignIn } from "../../src/services/identity/index.js";

const config = { clientId: "client", clientSecret: "secret", redirectUri: "https://api.test/auth/google/callback", webCallbackUrl: "https://web.test/auth/callback" };

function memoryStores() {
  const signIns = new Map<string, OAuthSignInModel>();
  const users = new Map<string, UserModel>();
  const links: (OAuthLink & { userId: string })[] = [];
  const signInRepo: OAuthSignInRepository = {
    create: async (input: CreateOAuthSignInInput) => {
      const row: OAuthSignInModel = { ...input, exchangeCode: null, userId: null, createdAt: new Date(), consumedAt: null };
      signIns.set(input.state, row);
      return row;
    },
    findPending: async (state) => signIns.get(state) ?? null,
    attachExchangeCode: async (state, exchangeCode, userId) => {
      signIns.set(state, { ...signIns.get(state)!, exchangeCode, userId });
    },
    consumeExchangeCode: async (code) => {
      const row = [...signIns.values()].find((entry) => entry.exchangeCode === code && entry.consumedAt === null);
      if (row === undefined) return null;
      const consumed = { ...row, consumedAt: new Date() };
      signIns.set(row.state, consumed);
      return consumed;
    },
    purgeExpired: async () => 0,
  };
  const userRepo: UserRepository = {
    findById: async (id) => users.get(id) ?? null,
    findByEmail: async (email) => [...users.values()].find((user) => user.email === email) ?? null,
    findByOAuth: async (provider, providerId) => {
      const link = links.find((entry) => entry.provider === provider && entry.providerId === providerId);
      return link === undefined ? null : (users.get(link.userId) ?? null);
    },
    findPasswordHash: async () => null,
    create: async (input: CreateUserInput) => {
      const user: UserModel = { id: `user-${users.size + 1}`, email: input.email, name: input.name ?? null, avatarUrl: input.avatarUrl ?? null, roles: ["member"], active: true, createdAt: new Date(), updatedAt: new Date(), lastLoginAt: null };
      users.set(user.id, user);
      return user;
    },
    linkOAuth: async (userId, link) => {
      links.push({ ...link, userId });
    },
    touchLogin: async () => undefined,
    updateProfile: async (userId) => users.get(userId)!,
  };
  return { signInRepo, userRepo, users, links };
}

const googleFetch: FetchLike = async (input, init) => {
  const url = new URL(input);
  if (url.pathname.endsWith("/token")) {
    expect(init.method).toBe("POST");
    return Response.json({ access_token: "ya29.token", token_type: "Bearer", expires_in: 3600, scope: "openid email profile" });
  }
  return Response.json({ sub: "google-123", email: "Grace@Example.com", email_verified: true, name: "Grace Newton", picture: "https://img.test/g.png" });
};

describe("GoogleSignIn", () => {
  it("starts with PKCE and state, completes, and hands out a one-time exchange code", async () => {
    const { signInRepo, userRepo, users, links } = memoryStores();
    const google = new GoogleSignIn(config, signInRepo, userRepo, googleFetch);
    const started = await google.start("/library");
    const url = new URL(started.url);
    expect(url.hostname).toContain("google");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe(started.state);
    expect(url.searchParams.get("redirect_uri")).toBe(config.redirectUri);

    const completed = await google.complete(started.state, "auth-code");
    expect(completed.redirectTo).toBe("/library");
    expect(users.size).toBe(1);
    expect(links[0]?.providerId).toBe("google-123");

    const user = await google.exchange(completed.exchangeCode);
    expect(user.email).toBe("grace@example.com");
    expect(user.name).toBe("Grace Newton");
    await expect(google.exchange(completed.exchangeCode)).rejects.toThrow(/already been used/);
  });

  it("links an existing account with the same verified email", async () => {
    const { signInRepo, userRepo, users } = memoryStores();
    await userRepo.create({ email: "grace@example.com", passwordHash: "x" });
    const google = new GoogleSignIn(config, signInRepo, userRepo, googleFetch);
    const started = await google.start(null);
    const completed = await google.complete(started.state, "auth-code");
    expect(users.size).toBe(1);
    expect((await google.exchange(completed.exchangeCode)).id).toBe("user-1");
  });

  it("rejects unknown or expired state", async () => {
    const { signInRepo, userRepo } = memoryStores();
    const google = new GoogleSignIn(config, signInRepo, userRepo, googleFetch);
    await expect(google.complete("nope", "code")).rejects.toThrow(/expired/);
  });
});
