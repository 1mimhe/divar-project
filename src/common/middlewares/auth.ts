import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/ApiError.ts";
import { env } from "../../config/env.ts";
import { verifyJwt, type AccessPayload } from "../../modules/auth/tokens.ts";
import { User } from "../../modules/users/user.model.ts";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export interface AuthUser {
  id: string;
  mobile: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return undefined;
}

async function loadUser(id: string): Promise<AuthUser | null> {
  const user = await User.findById(id, { _id: 1, mobile: 1 });
  if (!user) return null;
  return { id: String(user._id), mobile: user.mobile };
}

/**
 * Required auth: cookie first, Bearer fallback. 401 JSON — no redirects here
 * (API-only; view redirects land in Issue #4). Always `return`s after responding.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[ACCESS_COOKIE] ?? bearerToken(req);
  if (!token) {
    next(ApiError.unauthorized());
    return;
  }
  try {
    const payload = verifyJwt<AccessPayload>(token, env.JWT_PRIVATE_KEY);
    const user = await loadUser(payload.id);
    if (!user) {
      next(ApiError.unauthorized());
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : ApiError.unauthorized());
  }
}

/**
 * Optional auth: attaches `req.user` when a valid token is present, otherwise
 * continues anonymously. Never hangs, never throws (fixes legacy `addUserToReq`).
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[ACCESS_COOKIE] ?? bearerToken(req);
    if (!token) {
      next();
      return;
    }
    const payload = verifyJwt<AccessPayload>(token, env.JWT_PRIVATE_KEY);
    const user = await loadUser(payload.id);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}

/** Placeholder until roles land in Issue #3 — denies everything with a clear 403. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  next(ApiError.forbidden("Admin only. Roles are introduced in the domain phase."));
}
