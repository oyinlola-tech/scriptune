import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startHttpApp, type RunningApp } from "../helpers/testApp.helper.js";

describe("HttpModule", () => {
  let app: RunningApp;

  beforeAll(async () => {
    app = await startHttpApp();
  });

  afterAll(async () => {
    await app.stop();
  });

  it("answers /health with a report and a request id", async () => {
    const response = await fetch(`${app.baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const body = (await response.json()) as { name: string; status: string };
    expect(body.name).toBe("scriptune");
    expect(body.status).toBe("healthy");
  });

  it("answers /ready with 200 when every component is healthy", async () => {
    const response = await fetch(`${app.baseUrl}/ready`);
    expect(response.status).toBe(200);
  });

  it("echoes a well-formed incoming request id", async () => {
    const response = await fetch(`${app.baseUrl}/health`, {
      headers: { "x-request-id": "trace-abc-123" },
    });
    expect(response.headers.get("x-request-id")).toBe("trace-abc-123");
  });

  it("returns a JSON error body for unknown routes", async () => {
    const response = await fetch(`${app.baseUrl}/nowhere`);
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: { code: string; status: number } };
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns 405 with an Allow header for a wrong method", async () => {
    const response = await fetch(`${app.baseUrl}/health`, { method: "POST" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toContain("GET");
  });

  it("serves the OpenAPI document with the system routes", async () => {
    const response = await fetch(`${app.baseUrl}/openapi.json`);
    expect(response.status).toBe(200);
    const document = (await response.json()) as {
      openapi: string;
      info: { title: string };
      paths: Record<string, unknown>;
    };
    expect(document.openapi).toBe("3.1.0");
    expect(document.info.title).toBe("Scriptune API");
    expect(Object.keys(document.paths)).toEqual(expect.arrayContaining(["/health", "/ready"]));
  });

  it("serves the interactive docs page", async () => {
    const response = await fetch(`${app.baseUrl}/docs`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  it("answers CORS preflight for an allowed origin only", async () => {
    const allowed = await fetch(`${app.baseUrl}/health`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "GET",
      },
    });
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");

    const denied = await fetch(`${app.baseUrl}/health`, {
      method: "OPTIONS",
      headers: { origin: "http://evil.example", "access-control-request-method": "GET" },
    });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("exposes rate limit headers", async () => {
    const response = await fetch(`${app.baseUrl}/health`);
    expect(response.headers.get("ratelimit-limit")).toBe("300");
    expect(Number(response.headers.get("ratelimit-remaining"))).toBeLessThan(300);
  });
});
