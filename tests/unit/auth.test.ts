import assert from "node:assert/strict";
import { describe, test } from "node:test";
import express from "express";
import { ApiError } from "../../src/common/errors/ApiError.ts";
import { validateBody } from "../../src/common/middlewares/validate.ts";
import {
  checkOtpSchema,
  sendOtpSchema,
} from "../../src/modules/auth/auth.schema.ts";
import { codesEqual } from "../../src/common/utils/crypto.ts";
import { signJwt, ttlToSeconds, verifyJwt } from "../../src/modules/auth/jwt.ts";

// No I/O here beyond loopback: schemas, helpers, tokens, middleware, limiter.
describe("auth schemas", () => {
  test("accepts a valid IR mobile", () => {
    assert.equal(sendOtpSchema.safeParse({ mobile: "09123456789" }).success, true);
  });

  test("rejects malformed mobiles", () => {
    for (const mobile of ["123", "0912345678", "091234567890", "08123456789", ""]) {
      assert.equal(sendOtpSchema.safeParse({ mobile }).success, false, mobile);
    }
  });

  test("coerces a numeric OTP code to string", () => {
    const parsed = checkOtpSchema.safeParse({ mobile: "09123456789", code: 12345 });
    assert.equal(parsed.success, true);
    if (parsed.success) assert.equal(parsed.data.code, "12345");
  });

  test("rejects non-5-digit codes", () => {
    assert.equal(
      checkOtpSchema.safeParse({ mobile: "09123456789", code: "1234" }).success,
      false,
    );
  });
});

describe("OTP helpers", () => {
  test("codesEqual is exact and length-safe", () => {
    assert.equal(codesEqual("12345", "12345"), true);
    assert.equal(codesEqual("12345", "12346"), false);
    assert.equal(codesEqual("1234", "12345"), false);
  });

  test("ttlToSeconds parses shorthand", () => {
    assert.equal(ttlToSeconds("15m"), 900);
    assert.equal(ttlToSeconds("7d"), 604800);
  });
});

describe("tokens (HS256)", () => {
  const secret = "s".repeat(32);

  test("sign/verify round-trips", () => {
    const token = signJwt({ id: "u1", mobile: "09123456789" }, secret, "15m");
    const payload = verifyJwt<{ id: string; mobile: string }>(token, secret);
    assert.equal(payload.id, "u1");
    assert.equal(payload.mobile, "09123456789");
  });

  test("wrong secret and expired tokens are 401", () => {
    const token = signJwt({ id: "u1" }, secret, "15m");
    assert.throws(() => verifyJwt(token, "z".repeat(32)), (e: unknown) => e instanceof ApiError);
    const expired = signJwt({ id: "u1" }, secret, -10);
    assert.throws(() => verifyJwt(expired, secret), (e: unknown) => e instanceof ApiError);
  });

  test("malformed tokens are 401", () => {
    for (const bad of ["abc", "a.b", "a.b.c", ""]) {
      assert.throws(() => verifyJwt(bad, secret), (e: unknown) => e instanceof ApiError);
    }
  });
});

describe("validate middleware", () => {
  test("passes parsed data and fails with 400 details", () => {
    const middleware = validateBody(sendOtpSchema);
    const nextPass = (err?: unknown): void => {
      assert.equal(err, undefined);
    };
    middleware({ body: { mobile: "09123456789" } } as never, {} as never, nextPass);

    let status: unknown;
    const nextFail = (err?: unknown): void => {
      status = err;
    };
    middleware({ body: { mobile: "nope" } } as never, {} as never, nextFail);
    assert.ok(status instanceof ApiError && status.status === 400);
  });
});

describe("rate limiter", () => {
  test("allows N then 429s (mechanism check on a local instance)", async () => {
    // NOTE: uses a local instance, not the otpLimiter singleton — the singleton
    // is shared across ephemeral test apps (module-level MemoryStore) and must
    // not be consumed here, or later OTP sends would 429.
    const { rateLimit } = await import("express-rate-limit");
    const probe = rateLimit({
      windowMs: 60 * 1000,
      limit: 2,
      standardHeaders: false,
      legacyHeaders: false,
      handler: (_req, res) => res.status(429).json({ statusCode: 429 }),
    });
    const app = express();
    app.use(express.json());
    app.post("/t", probe, (_req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const codes: number[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await fetch(`http://127.0.0.1:${port}/t`, { method: "POST" });
        codes.push(res.status);
      }
      assert.deepEqual(codes, [200, 200, 429]);
    } finally {
      server.close();
    }
  });
});
