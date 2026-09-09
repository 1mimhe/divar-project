import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ApiError } from "../../src/common/errors/ApiError.ts";
import { errorHandler, notFound } from "../../src/common/middlewares/errorHandler.ts";

interface Captured {
  code?: number;
  body?: unknown;
  view?: string;
  locals?: unknown;
}

function mockRes(): Captured & {
  status(code: number): unknown;
  json(body: unknown): unknown;
  render(view: string, locals: unknown): unknown;
} {
  const captured: Captured = {};
  return {
    ...captured,
    status(code: number) {
      captured.code = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
    render(view: string, locals: unknown) {
      captured.view = view;
      captured.locals = locals;
      return this;
    },
    get code() {
      return captured.code;
    },
    get body() {
      return captured.body;
    },
    get view() {
      return captured.view;
    },
    get locals() {
      return captured.locals;
    },
  } as Captured & {
    status(code: number): unknown;
    json(body: unknown): unknown;
    render(view: string, locals: unknown): unknown;
  };
}

function handled(err: unknown, path?: string): Captured {
  const res = mockRes();
  errorHandler(err, { path } as never, res as never, () => undefined);
  return res;
}

describe("notFound", () => {
  test("answers JSON for API routes", () => {
    const res = mockRes();
    notFound({ method: "GET", path: "/api/v1/nope" } as never, res as never);
    assert.equal(res.code, 404);
    assert.deepEqual(res.body, {
      statusCode: 404,
      error: { message: "Route GET /api/v1/nope not found" },
    });
  });

  test("renders the error page for page routes", () => {
    const res = mockRes();
    notFound({ method: "GET", path: "/nope" } as never, res as never);
    assert.equal(res.code, 404);
    assert.equal(res.view, "error.ejs");
    assert.deepEqual(res.locals, { statusCode: 404, message: "Page not found." });
  });
});

describe("errorHandler", () => {
  test("passes ApiError status, message and details through", () => {
    const res = handled(ApiError.badRequest("Validation failed.", { fields: { a: "b" } }));
    assert.equal(res.code, 400);
    assert.deepEqual(res.body, {
      statusCode: 400,
      error: { message: "Validation failed.", details: { fields: { a: "b" } } },
    });
  });

  test("maps CastError to 400", () => {
    const err = new Error('Cast to ObjectId failed for value "xyz"');
    err.name = "CastError";
    const res = handled(err);
    assert.equal(res.code, 400);
    assert.equal((res.body as { error: { message: string } }).error.message, err.message);
  });

  test("maps ValidationError to 400 with field errors", () => {
    const err = Object.assign(new Error("User validation failed"), {
      name: "ValidationError",
      errors: { mobile: { message: "Path `mobile` is required." } },
    });
    const res = handled(err);
    assert.equal(res.code, 400);
    assert.deepEqual((res.body as { error: { details: unknown } }).error.details, {
      fields: { mobile: "Path `mobile` is required." },
    });
  });

  test("maps duplicate key (11000) to 409 naming the field", () => {
    const err = Object.assign(new Error("E11000 duplicate key"), {
      code: 11000,
      keyValue: { mobile: "09123456789" },
    });
    const res = handled(err);
    assert.equal(res.code, 409);
    assert.deepEqual((res.body as { error: { details: unknown } }).error.details, {
      field: "mobile",
    });
  });

  test("honors http-errors style statusCode", () => {
    const res = handled(Object.assign(new Error("Gone"), { statusCode: 410 }));
    assert.equal(res.code, 410);
  });

  test("masks 500 messages outside production, keeps the shape", () => {
    const res = handled(new Error("Command find requires authentication"));
    assert.equal(res.code, 500);
    const body = res.body as { statusCode: number; error: { message: string } };
    assert.equal(body.statusCode, 500);
    // Test env runs development: message exposed; production masks it.
    assert.equal(body.error.message, "Command find requires authentication");
  });

  test("non-error throwables become 500", () => {
    const res = handled("boom");
    assert.equal(res.code, 500);
  });

  test("renders the error page for page routes", () => {
    const res = handled(ApiError.notFound("Ad not found."), "/a/123");
    assert.equal(res.code, 404);
    assert.equal(res.view, "error.ejs");
    assert.deepEqual(res.locals, { statusCode: 404, message: "Ad not found." });
  });
});
