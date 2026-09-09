import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.ts";
import { verifyJwt } from "../modules/auth/jwt.ts";
import type { AccessPayload, AuthUser } from "../modules/auth/auth.types.ts";
import { ACCESS_COOKIE } from "../modules/auth/auth.constants.ts";
import { loadUser } from "../modules/auth/auth.middleware.ts";

/** Cookie-only session lookup for pages (no Bearer fallback). */
async function resolveUser(req: Request): Promise<AuthUser | null> {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return null;
    const payload = verifyJwt<AccessPayload>(token, env.JWT_PRIVATE_KEY);
    return await loadUser(payload.id);
  } catch {
    return null;
  }
}

/** Attaches the caller and mirrors it to views; anonymous continues as guest. */
export async function optionalLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await resolveUser(req);
  req.user = user ?? undefined;
  res.locals.user = user;
  next();
}

/** Redirects guests to the login page. Authenticated callers continue. */
export async function requireLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await resolveUser(req);
  if (!user) {
    res.redirect("/auth/login");
    return;
  }
  req.user = user;
  res.locals.user = user;
  next();
}
