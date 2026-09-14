import { ConflictError } from "@zudojs/errors";
import { describe, expect, it } from "vitest";
import { HealthRegistry } from "../../src/services/index.js";

describe("HealthRegistry", () => {
  it("is healthy with no probes", async () => {
    const report = await new HealthRegistry().check();
    expect(report.status).toBe("healthy");
    expect(report.healthy).toBe(true);
    expect(report.components).toEqual([]);
  });

  it("aggregates probe results", async () => {
    const registry = new HealthRegistry();
    registry.register("ok", () => ({ healthy: true, latencyMs: 1 }));
    registry.register("bad", () => ({ healthy: false, latencyMs: 2, message: "down" }));
    const report = await registry.check();
    expect(report.status).toBe("degraded");
    expect(report.components.map((component) => component.name)).toEqual(["ok", "bad"]);
  });

  it("treats a throwing probe as unhealthy", async () => {
    const registry = new HealthRegistry();
    registry.register("boom", () => {
      throw new Error("exploded");
    });
    const report = await registry.check();
    expect(report.status).toBe("unhealthy");
    expect(report.components[0]?.message).toBe("exploded");
  });

  it("times out a slow probe", async () => {
    const registry = new HealthRegistry();
    registry.register("slow", () => new Promise(() => undefined));
    const report = await registry.check(20);
    expect(report.components[0]?.healthy).toBe(false);
    expect(report.components[0]?.message).toMatch(/timed out/);
  });

  it("rejects duplicate names and supports unregistering", async () => {
    const registry = new HealthRegistry();
    const unregister = registry.register("db", () => ({ healthy: true, latencyMs: 0 }));
    expect(() => registry.register("db", () => ({ healthy: true, latencyMs: 0 }))).toThrow(
      ConflictError,
    );
    unregister();
    expect(registry.names()).toEqual([]);
  });
});
