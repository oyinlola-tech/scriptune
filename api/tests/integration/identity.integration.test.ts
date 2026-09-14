import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Runtime } from "@zudojs/runtime";
import { createApp } from "../../src/app.js";
import { TOKENS } from "../../src/constants/index.js";
import { TEST_ENV } from "../helpers/testApp.helper.js";

const databaseUrl = process.env["TEST_DATABASE_URL"];

interface Session { user: { id: string; email: string; name: string | null }; tokens: { accessToken: string; refreshToken: string }; sessionId: string }

describe.skipIf(databaseUrl === undefined)("identity integration", () => {
  let runtime: Runtime;
  let baseUrl: string;
  const email = `member-${Date.now()}@example.com`;

  const post = (path: string, body: unknown, token?: string) =>
    fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(token === undefined ? {} : { authorization: `Bearer ${token}` }) }, body: JSON.stringify(body) });

  beforeAll(async () => {
    runtime = await createApp({ env: { ...TEST_ENV, DATABASE_URL: databaseUrl } });
    await runtime.start();
    baseUrl = `http://127.0.0.1:${runtime.context.container.resolve(TOKENS.httpServer).address?.port}`;
  });

  afterAll(async () => {
    await runtime?.stop();
  });

  it("registers, reads the profile, and rejects a duplicate email", async () => {
    const response = await post("/auth/register", { email: email.toUpperCase(), password: "correct horse battery", name: "Grace" });
    expect(response.status).toBe(201);
    const session = (await response.json()) as Session;
    expect(session.user.email).toBe(email);
    expect(session.tokens.accessToken.split(".")).toHaveLength(3);
    const me = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${session.tokens.accessToken}` } });
    expect(me.status).toBe(200);
    expect(((await me.json()) as { user: { name: string } }).user.name).toBe("Grace");
    expect((await post("/auth/register", { email, password: "another password" })).status).toBe(409);
  });

  it("logs in, refreshes with rotation, and logs out", async () => {
    expect((await post("/auth/login", { email, password: "wrong password" })).status).toBe(401);
    const login = await post("/auth/login", { email, password: "correct horse battery" });
    expect(login.status).toBe(200);
    const session = (await login.json()) as Session;

    const refresh = await post("/auth/refresh", { refreshToken: session.tokens.refreshToken });
    expect(refresh.status).toBe(200);
    const rotated = (await refresh.json()) as { tokens: { accessToken: string; refreshToken: string } };
    expect(rotated.tokens.refreshToken).not.toBe(session.tokens.refreshToken);
    expect((await post("/auth/refresh", { refreshToken: session.tokens.refreshToken })).status).toBeGreaterThanOrEqual(401);

    const again = await post("/auth/login", { email, password: "correct horse battery" });
    const fresh = (await again.json()) as Session;
    const logout = await fetch(`${baseUrl}/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${fresh.tokens.accessToken}` } });
    expect(logout.status).toBe(204);
    const afterLogout = await fetch(`${baseUrl}/auth/me`, { headers: { authorization: `Bearer ${fresh.tokens.accessToken}` } });
    expect(afterLogout.status).toBe(401);
  });

  it("guards protected routes and reports Google as disabled", async () => {
    expect((await fetch(`${baseUrl}/auth/me`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/auth/me`, { headers: { authorization: "Bearer not-a-token" } })).status).toBe(401);
    expect((await fetch(`${baseUrl}/library/saved`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/auth/google`, { redirect: "manual" })).status).toBe(404);
    expect((await post("/auth/register", { email: "bad", password: "short" })).status).toBe(400);
  });

  it("deletes the account and everything under it", async () => {
    const leaving = `leaving-${Date.now()}@example.com`;
    const created = (await (await post("/auth/register", { email: leaving, password: "correct horse battery" })).json()) as Session;
    const headers = { authorization: `Bearer ${created.tokens.accessToken}`, "content-type": "application/json" };
    expect((await fetch(`${baseUrl}/library/saved`, { method: "POST", headers, body: JSON.stringify({ type: "verse", key: "KJV:john:3:16" }) })).status).toBeLessThan(500);
    const deleted = await fetch(`${baseUrl}/auth/me`, { method: "DELETE", headers });
    expect(deleted.status).toBe(204);
    expect((await fetch(`${baseUrl}/auth/me`, { headers })).status).toBe(401);
    expect((await post("/auth/login", { email: leaving, password: "correct horse battery" })).status).toBe(401);
    expect((await post("/auth/register", { email: leaving, password: "correct horse battery" })).status).toBe(201);
  });
});
