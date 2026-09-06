import { randomInt, randomUUID } from "node:crypto";
import { ApiError } from "../../common/errors/ApiError.ts";
import { codesEqual, hashToken } from "../../common/utils/crypto.ts";
import { env } from "../../config/env.ts";
import { User } from "../users/user.model.ts";
import type { SmsProvider } from "./sms.provider.ts";
import { smsProvider as defaultSmsProvider } from "./sms.provider.ts";
import { signJwt, verifyJwt } from "./tokens.ts";
import {
  ACCESS_TTL_SEC,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
  REFRESH_TTL_SEC,
} from "./auth.constants.ts";
import type { OtpSent, RefreshPayload, TokenPair, VerifiedSession } from "./auth.types.ts";

function issueTokenPair(userId: string, mobile: string): TokenPair {
  const accessToken = signJwt({ id: userId, mobile }, env.JWT_PRIVATE_KEY, ACCESS_TTL_SEC);
  // jti makes every refresh token unique: without it, two rotations within the
  // same second produce byte-identical JWTs (second-granularity iat) and
  // rotation/revocation silently no-ops.
  const refreshToken = signJwt(
    { id: userId, type: "refresh", jti: randomUUID() },
    env.JWT_REFRESH_KEY,
    REFRESH_TTL_SEC,
  );
  return { accessToken, refreshToken };
}

/**
 * Issues a code for `mobile`, creating the user on first request.
 * @throws {ApiError} 429 with `retryAfter` seconds while a live code exists.
 */
export async function sendOTP(
  mobile: string,
  sms: SmsProvider = defaultSmsProvider,
): Promise<OtpSent> {
  const now = Date.now();
  const existing = await User.findOne({ mobile });

  if (existing?.otp?.code && (existing.otp.expiresIn ?? 0) > now) {
    const retryAfter = Math.ceil(((existing.otp.expiresIn ?? now) - now) / 1000);
    throw ApiError.tooManyRequests("OTP Code is not Expired. Please Try Later.", { retryAfter });
  }

  // Stored as a string so numeric JSON input compares correctly.
  const code = String(randomInt(10000, 99999));
  const otp = { code, expiresIn: now + OTP_TTL_MS, attempts: 0 };

  if (existing) {
    existing.otp = otp;
    await existing.save();
  } else {
    await User.create({ mobile, otp });
  }

  const sent = await sms.sendOtp(mobile, code);
  return { retryAfter: OTP_TTL_MS / 1000, ...sent };
}

/**
 * Consumes a code: single-use, expires after the TTL, locks after too many
 * wrong attempts. Success clears the code, marks the mobile verified and
 * opens a session.
 * @throws {ApiError} 400 without a pending code, 401 for expired/wrong codes,
 * 429 once the attempt cap is hit.
 */
export async function verifyOTP(mobile: string, code: string): Promise<VerifiedSession> {
  const user = await User.findByMobile(mobile);
  const now = Date.now();

  if (!user.otp?.code) {
    throw ApiError.badRequest("No OTP requested for this number. Please request a code first.");
  }
  if ((user.otp.expiresIn ?? 0) < now) {
    user.otp = undefined;
    await user.save();
    throw ApiError.unauthorized("OTP Code is Expired. Please Get New Code.");
  }
  if ((user.otp.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    user.otp = undefined;
    await user.save();
    throw ApiError.tooManyRequests("Too many wrong attempts. Please request a new code.");
  }
  if (!codesEqual(user.otp.code, code)) {
    user.otp.attempts = (user.otp.attempts ?? 0) + 1;
    await user.save();
    throw ApiError.unauthorized("OTP Code is Wrong. Please Try Again.");
  }

  user.otp = undefined;
  if (!user.verifiedMobile) user.verifiedMobile = true;

  const tokens = issueTokenPair(String(user._id), user.mobile);
  user.refreshTokens.push({ hash: hashToken(tokens.refreshToken), createdAt: new Date() });
  await user.save();

  return {
    ...tokens,
    user: { _id: user._id, mobile: user.mobile, verifiedMobile: user.verifiedMobile },
  };
}

/**
 * Rotates a refresh token: the presented token is revoked and a new pair is
 * issued, so reuse of a stolen token fails closed.
 * @throws {ApiError} 401 for unknown, revoked or cross-secret tokens.
 */
export async function refreshSession(refreshToken: string): Promise<TokenPair> {
  const payload = verifyJwt<RefreshPayload>(refreshToken, env.JWT_REFRESH_KEY);
  if (payload.type !== "refresh" || !payload.id) throw ApiError.unauthorized("Invalid token.");

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized("User Not Found.");

  const hash = hashToken(refreshToken);
  const index = user.refreshTokens.findIndex((t) => codesEqual(t.hash, hash));
  if (index === -1) throw ApiError.unauthorized("Invalid token.");

  // Rotation: the presented token dies here; theft + reuse is detectable (old hash gone).
  user.refreshTokens.splice(index, 1);
  const tokens = issueTokenPair(String(user._id), user.mobile);
  user.refreshTokens.push({ hash: hashToken(tokens.refreshToken), createdAt: new Date() });
  await user.save();
  return tokens;
}

/** Revokes one refresh token, or every session when none is presented. */
export async function logout(userId: string, refreshToken?: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;
  if (!refreshToken) {
    user.refreshTokens = [];
  } else {
    const hash = hashToken(refreshToken);
    user.refreshTokens = user.refreshTokens.filter((t) => !codesEqual(t.hash, hash));
  }
  await user.save();
}
