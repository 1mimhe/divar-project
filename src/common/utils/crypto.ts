import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string compare with a length guard (`timingSafeEqual` throws on mismatch). */
export function codesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** sha256 hex digest. Used for refresh-token storage: the raw token never hits the DB. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
