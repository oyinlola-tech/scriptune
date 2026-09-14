import { describe, expect, it } from "vitest";
import { googleStartQuerySchema, isCustomSchemeUrl } from "../../src/validators/auth.validators.js";

describe("googleStartQuerySchema", () => {
  it("accepts a relative web path", () => {
    expect(googleStartQuerySchema.parse({ redirect: "/library" }).redirect).toBe("/library");
  });

  it("accepts the mobile app's deep link", () => {
    expect(googleStartQuerySchema.parse({ redirect: "scriptune://auth/callback" }).redirect).toBe("scriptune://auth/callback");
  });

  it("rejects protocol-relative, backslash and http(s) redirects", () => {
    expect(googleStartQuerySchema.safeParse({ redirect: "//evil.example" }).success).toBe(false);
    expect(googleStartQuerySchema.safeParse({ redirect: "https://evil.example/auth" }).success).toBe(false);
    expect(googleStartQuerySchema.safeParse({ redirect: "HTTP://evil.example" }).success).toBe(false);
    expect(googleStartQuerySchema.safeParse({ redirect: "/\\evil.example" }).success).toBe(false);
    expect(googleStartQuerySchema.safeParse({ redirect: "/%5cevil.example" }).success).toBe(false);
    expect(googleStartQuerySchema.parse({ redirect: "/library?tab=notes" }).redirect).toBe("/library?tab=notes");
  });
});

describe("isCustomSchemeUrl", () => {
  it("tells app deep links apart from web paths", () => {
    expect(isCustomSchemeUrl("scriptune://auth/callback")).toBe(true);
    expect(isCustomSchemeUrl("/auth/callback")).toBe(false);
    expect(isCustomSchemeUrl("https://scriptune.app/auth/callback")).toBe(false);
  });
});
