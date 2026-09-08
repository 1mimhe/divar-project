import flash from "connect-flash";
import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import { env } from "../config/env.ts";

/** Cookie session for flash messages (dev single-process store). */
export function sessionMiddleware() {
  return session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000,
    },
  });
}

/** One-shot message queue on `req.flash(type, message)`. */
export function flashMiddleware() {
  return flash();
}

export interface FlashMessages {
  success?: string;
  error?: string;
}

/** Drains queued messages for templates. */
export function consumeFlash(req: Request): FlashMessages {
  const success = (req.flash("success") as string[])[0];
  const error = (req.flash("error") as string[])[0];
  return { ...(success ? { success } : {}), ...(error ? { error } : {}) };
}

/** Drains queued messages into `res.locals.flash` for every view. */
export function flashLocals(req: Request, res: Response, next: NextFunction): void {
  res.locals.flash = consumeFlash(req);
  next();
}
