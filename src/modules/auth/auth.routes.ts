import { Router } from "express";
import { createApiLimiter } from "../../common/middlewares/rateLimit.ts";
import { validateBody } from "../../common/middlewares/validate.ts";
import { logoutHandler, me, refreshTokens, sendOtp, verifyOtp } from "./auth.controller.ts";
import { optionalAuth, requireAuth } from "./auth.middleware.ts";
import {
  OTP_SEND_LIMIT,
  OTP_SEND_WINDOW_MS,
  OTP_VERIFY_LIMIT,
  OTP_VERIFY_WINDOW_MS,
} from "./auth.constants.ts";
import { checkOtpSchema, sendOtpSchema } from "./auth.schema.ts";

/** OTP dispatch: tight tap — 5-digit codes are brute-forceable. */
const otpLimiter = createApiLimiter({
  windowMs: OTP_SEND_WINDOW_MS,
  limit: OTP_SEND_LIMIT,
  message: "Too many OTP requests. Please try again later.",
});

/** OTP verification: backstop behind the per-code attempt cap. */
const verifyLimiter = createApiLimiter({
  windowMs: OTP_VERIFY_WINDOW_MS,
  limit: OTP_VERIFY_LIMIT,
  message: "Too many verification attempts. Please try again later.",
});

export const authRouter = Router();

authRouter.post("/otp/send", otpLimiter, validateBody(sendOtpSchema), sendOtp);
authRouter.post("/otp/verify", verifyLimiter, validateBody(checkOtpSchema), verifyOtp);
authRouter.post("/refresh", refreshTokens);
authRouter.post("/logout", optionalAuth, logoutHandler);
authRouter.get("/me", requireAuth, me);
