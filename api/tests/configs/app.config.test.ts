import { ConfigurationError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { loadAppConfig } from "../../src/configs/index.js";
import { TEST_ENV } from "../helpers/testApp.helper.js";

describe("loadAppConfig", () => {
  it("reads typed values from the environment", async () => {
    const config = await loadAppConfig({ ...TEST_ENV, PORT: "4321", TRUST_PROXY: "2" });
    expect(config.environment).toBe("test");
    expect(config.port).toBe(4321);
    expect(config.host).toBe("127.0.0.1");
    expect(config.trustProxy).toBe(2);
    expect(config.logLevel).toBe("fatal");
    expect(config.webOrigins).toEqual(["http://localhost:3000", "https://scriptune.app"]);
    expect(config.databaseUrl).toBe(TEST_ENV["DATABASE_URL"]);
  });

  it("applies defaults for optional values", async () => {
    const config = await loadAppConfig({
      DATABASE_URL: TEST_ENV["DATABASE_URL"],
      WEB_ORIGIN: "http://localhost:3000",
      AUTH_ACCESS_SECRET: TEST_ENV["AUTH_ACCESS_SECRET"],
      AUTH_REFRESH_SECRET: TEST_ENV["AUTH_REFRESH_SECRET"],
    });
    expect(config.environment).toBe("development");
    expect(config.port).toBe(4000);
    expect(config.publicUrl).toBe("http://localhost:4000");
    expect(config.logLevel).toBe("info");
    expect(config.rateLimit).toEqual({ max: 300, windowMs: 60_000 });
  });

  it("rejects a missing database url", async () => {
    await expect(loadAppConfig({ WEB_ORIGIN: "http://localhost:3000" })).rejects.toBeInstanceOf(
      ConfigurationError,
    );
  });

  it("requires distinct auth secrets of at least 32 characters", async () => {
    await expect(loadAppConfig({ ...TEST_ENV, AUTH_ACCESS_SECRET: "short" })).rejects.toThrow(/AUTH_ACCESS_SECRET/);
    await expect(
      loadAppConfig({ ...TEST_ENV, AUTH_REFRESH_SECRET: TEST_ENV["AUTH_ACCESS_SECRET"] }),
    ).rejects.toThrow(/must differ/);
  });

  it("rejects a non-postgres database url", async () => {
    await expect(
      loadAppConfig({ ...TEST_ENV, DATABASE_URL: "mysql://localhost/db" }),
    ).rejects.toThrow(/postgresql/);
  });

  it("rejects an origin that carries a path", async () => {
    await expect(
      loadAppConfig({ ...TEST_ENV, WEB_ORIGIN: "http://localhost:3000/app" }),
    ).rejects.toThrow(/without a path/);
  });

  it("rejects an out-of-range port", async () => {
    await expect(loadAppConfig({ ...TEST_ENV, PORT: "70000" })).rejects.toThrow(/PORT/);
  });

  it("rejects an unknown log level", async () => {
    await expect(loadAppConfig({ ...TEST_ENV, LOG_LEVEL: "loud" })).rejects.toThrow(/LOG_LEVEL/);
  });
});

describe("readGoogleOAuthConfig", () => {
  const withGoogle = { ...TEST_ENV, GOOGLE_CLIENT_ID: "client", GOOGLE_CLIENT_SECRET: "secret" };

  it("defaults the mobile callback to the app scheme", async () => {
    const config = await loadAppConfig(withGoogle);
    expect(config.google?.mobileCallbackUrl).toBe("scriptune://auth/callback");
    expect(config.google?.webCallbackUrl).toBe("http://localhost:3000/auth/callback");
  });

  it("refuses an http mobile callback", async () => {
    await expect(loadAppConfig({ ...withGoogle, MOBILE_AUTH_CALLBACK_URL: "https://evil.example/cb" })).rejects.toBeInstanceOf(ConfigurationError);
  });
});
