import type { CookieOptions, NextFunction, Request, Response } from "express";
import { isProd } from "../../config/env.ts";
import {
  logout,
  refreshSession,
  sendOTP,
  verifyOTP,
} from "./auth.service.ts";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_COOKIE,
  REFRESH_TTL_SEC,
} from "./auth.constants.ts";
import type { CheckOtpDto, SendOtpDto } from "./auth.schema.ts";

const baseCookie: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  path: "/",
};

const accessCookie: CookieOptions = { ...baseCookie, maxAge: ACCESS_TTL_SEC * 1000 };
const refreshCookie: CookieOptions = { ...baseCookie, maxAge: REFRESH_TTL_SEC * 1000 };

/** Sets the session cookie pair (shared with the view layer). */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookie);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookie);
}

/** Clears the session cookie pair (shared with the view layer). */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, maxAge: undefined });
}

/** Dispatches an OTP. Off-production the code is echoed back for the demo. */
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await sendOTP((req.body as SendOtpDto).mobile);
    res.status(200).json({ message: "OTP Sent Successfully.", ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * Verifies an OTP and opens a session. Tokens travel as `httpOnly` cookies;
 * the access token is also returned in the body for non-browser clients.
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mobile, code } = req.body as CheckOtpDto;
    const session = await verifyOTP(mobile, code);
    setAuthCookies(res, session);
    res.status(200).json({
      message: "User login successfully.",
      user: session.user,
      accessToken: session.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

/** Rotates the presented refresh token (body or cookie) and re-cookies the pair. */
export async function refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const presented = (req.body?.refreshToken as string | undefined) ?? req.cookies?.[REFRESH_COOKIE];
    if (!presented) {
      res.status(400).json({
        statusCode: 400,
        error: { message: "Refresh token is required." },
      });
      return;
    }
    const tokens = await refreshSession(presented);
    setAuthCookies(res, tokens);
    res.status(200).json({ message: "Token refreshed.", accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

/** Ends the session and clears both cookies, even when no session exists. */
export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const presented = (req.body?.refreshToken as string | undefined) ?? req.cookies?.[REFRESH_COOKIE];
    if (req.user) await logout(req.user.id, presented);
    clearAuthCookies(res);
    res.status(200).json({ message: "User successfully logged out." });
  } catch (err) {
    next(err);
  }
}

/** Returns the caller attached by `requireAuth`. */
export function me(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
