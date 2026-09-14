import { NotFoundError } from "@zudojs/errors";
import { HttpMiddlewareError, notFound, tooManyRequests } from "@zudojs/http";
import { describe, expect, it } from "vitest";
import { toErrorBody, toErrorResponse } from "../../src/errors/index.js";

describe("error mapper", () => {
  it("exposes client errors with their code and message", () => {
    const body = toErrorBody(notFound("Hymn not found."), "req-1");
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Hymn not found.",
      status: 404,
      requestId: "req-1",
    });
  });

  it("never leaks details of unexpected failures", () => {
    const body = toErrorBody(new Error("database password is hunter2"));
    expect(body.error.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).not.toContain("hunter2");
  });

  it("finds the responsible error beneath middleware wrappers", () => {
    const wrapped = new HttpMiddlewareError("Middleware threw.", {
      cause: new NotFoundError("Verse not found."),
    });
    expect(toErrorBody(wrapped).error.status).toBe(404);
  });

  it("applies error headers and the request id to the response", () => {
    const response = toErrorResponse(
      tooManyRequests("Slow down.", { headers: { "retry-after": "7" } }),
      "req-2",
    );
    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBe("7");
    expect(response.headers["x-request-id"]).toBe("req-2");
  });
});
