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

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, maxAge: undefined });
}

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await sendOTP((req.body as SendOtpDto).mobile);
    res.status(200).json({ message: "OTP Sent Successfully.", ...result });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mobile, code } = req.body as CheckOtpDto;
    const session = await verifyOTP(mobile, code);
    res.cookie(ACCESS_COOKIE, session.accessToken, accessCookie);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookie);
    res.status(200).json({
      message: "User login successfully.",
      user: session.user,
      accessToken: session.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

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
    res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookie);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookie);
    res.status(200).json({ message: "Token refreshed.", accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

/** Always clears cookies — even for anonymous/expired callers (fixes legacy view logout). */
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

export function me(req: Request, res: Response): void {
  res.status(200).json({ user: req.user });
}
