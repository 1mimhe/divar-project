import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import express from "express";
import mongoose from "mongoose";
import { createExpressApp } from "../src/app.ts";
import { ApiError } from "../src/common/errors/ApiError.ts";
import { validateBody } from "../src/common/middlewares/validate.ts";
import {
  checkOtpSchema,
  sendOtpSchema,
} from "../src/modules/auth/auth.schema.ts";
import { codesEqual } from "../src/common/utils/crypto.ts";
import { signJwt, ttlToSeconds, verifyJwt } from "../src/modules/auth/tokens.ts";
import { User } from "../src/modules/users/user.model.ts";

// ---------------------------------------------------------------------------
// Always-run unit tests (no DB, no network beyond loopback)
// ---------------------------------------------------------------------------

describe("auth schemas", () => {
  test("accepts a valid IR mobile", () => {
    assert.equal(sendOtpSchema.safeParse({ mobile: "09123456789" }).success, true);
  });

  test("rejects malformed mobiles", () => {
    for (const mobile of ["123", "0912345678", "091234567890", "08123456789", ""]) {
      assert.equal(sendOtpSchema.safeParse({ mobile }).success, false, mobile);
    }
  });

  test("coerces a numeric OTP code to string (legacy false-negative fix)", () => {
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
    let captured: unknown;
    const nextPass = (err?: unknown): void => {
      assert.equal(err, undefined);
    };
    middleware({ body: { mobile: "09123456789" } } as never, {} as never, nextPass);
    void captured;

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

describe("auth routes without token", () => {
  test("GET /me is 401 JSON (no double-send, no hang)", async () => {
    const app = createExpressApp();
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/auth/me`);
      assert.equal(res.status, 401);
      const body = (await res.json()) as { statusCode: number };
      assert.equal(body.statusCode, 401);
    } finally {
      server.close();
    }
  });

  test("logout always clears cookies, even anonymous", async () => {
    const app = createExpressApp();
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const port = (server.address() as { port: number }).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/auth/logout`, { method: "POST" });
      assert.equal(res.status, 200);
      const cookies = res.headers.getSetCookie().join(";");
      assert.match(cookies, /access_token=/);
      assert.match(cookies, /refresh_token=/);
    } finally {
      server.close();
    }
  });
});

// ---------------------------------------------------------------------------
// DB-gated integration tests (real local Mongo; skipped when unreachable)
// ---------------------------------------------------------------------------

const TEST_DB =
  process.env.TEST_MONGODB_URL ?? "mongodb://127.0.0.1:27017/divar-store-test";

// Gate on a real write round-trip, not just TCP connect: the local Mongo may
// require auth, in which case reads/writes fail and these tests must skip.
let dbUp = false;
try {
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 3000 });
  await mongoose.connection.db.collection("__gate").insertOne({ at: new Date() });
  await mongoose.connection.db.collection("__gate").deleteMany({});
  // Fresh slate: drops indexes from earlier runs (notably a stale unique
  // `notes.for_1`); schema-declared indexes rebuild on first model use.
  await mongoose.connection.db.collection("users").drop().catch(() => undefined);
  dbUp = true;
} catch {
  dbUp = false;
  try {
    await mongoose.disconnect();
  } catch {
    // ignore — never connected
  }
}

const usedMobiles: string[] = [];
function freshMobile(): string {
  const mobile = `09${String(Math.floor(100000000 + Math.random() * 900000000))}`;
  usedMobiles.push(mobile);
  return mobile;
}

function cookiesOf(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

async function startApp(): Promise<{ base: string; close: () => void }> {
  const app = createExpressApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  return { base: `http://127.0.0.1:${port}`, close: () => server.close() };
}

describe("OTP flow (needs local Mongo)", { skip: !dbUp }, () => {
  test("send -> verify round-trip sets cookies and verifies /me", async () => {
    const { base, close } = await startApp();
    try {
      const mobile = freshMobile();
      const sent = await fetch(`${base}/api/v1/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      assert.equal(sent.status, 200);
      const sentBody = (await sent.json()) as { previewCode?: string };
      assert.ok(sentBody.previewCode, "mock provider exposes previewCode off-prod");

      const verified = await fetch(`${base}/api/v1/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, code: sentBody.previewCode }),
      });
      assert.equal(verified.status, 200);
      const jar = cookiesOf(verified);
      assert.match(jar, /access_token=/);

      const me = await fetch(`${base}/api/v1/auth/me`, { headers: { cookie: jar } });
      assert.equal(me.status, 200);
      const meBody = (await me.json()) as { user: { mobile: string } };
      assert.equal(meBody.user.mobile, mobile);
    } finally {
      close();
    }
  });

  test("resend within the window is 429 with retryAfter", async () => {
    const { base, close } = await startApp();
    try {
      const mobile = freshMobile();
      const first = await fetch(`${base}/api/v1/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      assert.equal(first.status, 200);
      const second = await fetch(`${base}/api/v1/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      assert.equal(second.status, 429);
      const body = (await second.json()) as { error: { details: { retryAfter: number } } };
      assert.ok(body.error.details.retryAfter > 0);
    } finally {
      close();
    }
  });

  test("5 wrong codes lock the code; the 6th verify is 429", async () => {
    const { base, close } = await startApp();
    try {
      const mobile = freshMobile();
      const sent = await fetch(`${base}/api/v1/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      assert.equal(sent.status, 200, "setup send must succeed");
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await fetch(`${base}/api/v1/auth/otp/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mobile, code: "00000" }),
        });
        statuses.push(res.status);
      }
      assert.deepEqual(statuses.slice(0, 5), [401, 401, 401, 401, 401]);
      assert.equal(statuses[5], 429);
    } finally {
      close();
    }
  });

  test("refresh rotates: old token dies, logout revokes", async () => {
    const { base, close } = await startApp();
    try {
      const mobile = freshMobile();
      const sent = await fetch(`${base}/api/v1/auth/otp/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const { previewCode } = (await sent.json()) as { previewCode: string };
      const verified = await fetch(`${base}/api/v1/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, code: previewCode }),
      });
      const jar = cookiesOf(verified);
      const refreshToken = jar.match(/refresh_token=([^;]+)/)?.[1];
      assert.ok(refreshToken);

      const rotated = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: jar },
      });
      assert.equal(rotated.status, 200);

      const replay = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      assert.equal(replay.status, 401);

      const freshJar = cookiesOf(rotated);
      const out = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { cookie: freshJar },
      });
      assert.equal(out.status, 200);
      assert.match(out.headers.getSetCookie().join(";"), /access_token=/);

      const afterLogout = await fetch(`${base}/api/v1/auth/me`, {
        headers: { cookie: freshJar },
      });
      assert.equal(afterLogout.status, 200, "access token still valid until expiry");

      const newRefresh = freshJar.match(/refresh_token=([^;]+)/)?.[1];
      const reuseRefresh = await fetch(`${base}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: newRefresh }),
      });
      assert.equal(reuseRefresh.status, 401, "logout revoked the refresh token");
    } finally {
      close();
    }
  });
});

after(async () => {
  if (!dbUp) return;
  try {
    if (usedMobiles.length) await User.deleteMany({ mobile: { $in: usedMobiles } });
  } finally {
    await mongoose.disconnect();
  }
});
