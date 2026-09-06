import { createApiLimiter } from "../../common/middlewares/rateLimit.ts";
import {
  OTP_SEND_LIMIT,
  OTP_SEND_WINDOW_MS,
  OTP_VERIFY_LIMIT,
  OTP_VERIFY_WINDOW_MS,
} from "./auth.constants.ts";

/** OTP dispatch: tight tap — 5-digit codes are brute-forceable. */
export const otpLimiter = createApiLimiter({
  windowMs: OTP_SEND_WINDOW_MS,
  limit: OTP_SEND_LIMIT,
  message: "Too many OTP requests. Please try again later.",
});

/** OTP verification: backstop behind the per-code attempt cap. */
export const verifyLimiter = createApiLimiter({
  windowMs: OTP_VERIFY_WINDOW_MS,
  limit: OTP_VERIFY_LIMIT,
  message: "Too many verification attempts. Please try again later.",
});
