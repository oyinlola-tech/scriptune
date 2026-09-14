import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TOKENS } from "../../src/constants/index.js";
import { startHttpApp, type RunningApp } from "../helpers/testApp.helper.js";

const QUERIES = ["system.health"] as const;

describe("handler registration", () => {
  let app: RunningApp;

  beforeAll(async () => {
    app = await startHttpApp();
  });

  afterAll(async () => {
    await app.stop();
  });

  it.each(QUERIES)("registers the %s query", (type) => {
    const queryBus = app.runtime.context.container.resolve(TOKENS.queryBus);
    expect(queryBus.has(type)).toBe(true);
  });

  it("namespaces every handler by module", () => {
    const container = app.runtime.context.container;
    const all = [
      ...container.resolve(TOKENS.commandBus).getCommandTypes(),
      ...container.resolve(TOKENS.queryBus).getQueryTypes(),
    ];
    expect(all.filter((type) => !type.includes("."))).toEqual([]);
  });

  it("registers no handler twice", () => {
    const container = app.runtime.context.container;
    const queries = container.resolve(TOKENS.queryBus).getQueryTypes();
    expect(new Set(queries).size).toBe(queries.length);
  });
});
