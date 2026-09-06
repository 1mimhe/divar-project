import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "../../common/errors/ApiError.ts";

/**
 * Minimal HS256 JWT sign/verify on `node:crypto`.
 *
 * Why not `jsonwebtoken`: v9's transitive `jwa → buffer-equal-constant-time`
 * touches the long-removed `SlowBuffer` API, so `require("jsonwebtoken")`
 * throws on Node 22+. The surface used here (HS256 + `exp`) is small enough
 * to implement in auditable lines; swap back to the library once upstream
 * drops the dead dependency. Payload shape stays `{id, mobile?, type?}`.
 */

export interface AccessPayload {
  id: string;
  mobile: string;
}

export interface RefreshPayload {
  id: string;
  type: "refresh";
}

function base64url(input: Buffer | string): string {
  return (typeof input === "string" ? Buffer.from(input) : input).toString("base64url");
}

/** Accepts seconds or `"15m" | "7d" | "30s" | "2h"` strings. */
export function ttlToSeconds(ttl: number | string): number {
  if (typeof ttl === "number") return ttl;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`Unsupported ttl: ${ttl}`);
  const value = Number(match[1]);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as "s" | "m" | "h" | "d"];
  return value * unit;
}

export function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number | string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + ttlToSeconds(expiresIn) }),
  );
  const head = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest();
  return `${head}.${body}.${sig.toString("base64url")}`;
}

export function verifyJwt<T>(token: string, secret: string): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw ApiError.unauthorized("Invalid token.");
  const [head, body, sig] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(head, "base64url").toString());
  } catch {
    throw ApiError.unauthorized("Invalid token.");
  }
  if (header.alg !== "HS256") throw ApiError.unauthorized("Invalid token.");

  const expected = createHmac("sha256", secret).update(`${head}.${body}`).digest();
  const actual = Buffer.from(sig, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw ApiError.unauthorized("Invalid token.");
  }

  let payload: { exp?: number } & Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    throw ApiError.unauthorized("Invalid token.");
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    throw ApiError.unauthorized("Invalid token.");
  }
  return payload as T;
}
