// OTP policy: 5-digit codes, 2-minute life, 5 verify attempts per code.
export const OTP_TTL_MS = 2 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

// Session lifetimes (seconds). Cookie maxAge derives from these (* 1000).
export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;

// Cookie names for the session tokens.
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// IP rate limits: OTP dispatch and verification.
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000;
export const OTP_SEND_LIMIT = 5;
export const OTP_VERIFY_WINDOW_MS = 10 * 60 * 1000;
export const OTP_VERIFY_LIMIT = 10;
