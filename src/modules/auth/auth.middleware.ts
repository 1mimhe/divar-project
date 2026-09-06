import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../common/errors/ApiError.ts";
import { env } from "../../config/env.ts";
import { verifyJwt } from "./jwt.ts";
import { User } from "../users/user.model.ts";
import { ACCESS_COOKIE } from "./auth.constants.ts";
import type { AccessPayload, AuthUser } from "./auth.types.ts";

/** Extracts a `Bearer` token from the authorization header, if present. */
function bearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return undefined;
}

/** Loads the public caller profile; `null` when the user no longer exists. */
async function loadUser(id: string): Promise<AuthUser | null> {
  const user = await User.findById(id, { _id: 1, mobile: 1 });
  if (!user) return null;
  return { id: String(user._id), mobile: user.mobile };
}

/**
 * Required auth: cookie first, `Bearer` fallback. Rejects with 401 JSON —
 * no redirects on API routes.
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
 * Optional auth: attaches `req.user` for valid tokens, otherwise continues
 * anonymously. Never throws.
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

/** Deny-all placeholder until role support exists. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  next(ApiError.forbidden("Admin only."));
}
