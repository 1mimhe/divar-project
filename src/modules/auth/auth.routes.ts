import { Router } from "express";
import { otpLimiter, verifyLimiter } from "../../common/middlewares/rateLimit.ts";
import { validateBody } from "../../common/middlewares/validate.ts";
import { logoutHandler, me, refreshTokens, sendOtp, verifyOtp } from "./auth.controller.ts";
import { optionalAuth, requireAuth } from "./auth.middleware.ts";
import { checkOtpSchema, sendOtpSchema } from "./auth.schema.ts";

export const authRouter = Router();

authRouter.post("/otp/send", otpLimiter, validateBody(sendOtpSchema), sendOtp);
authRouter.post("/otp/verify", verifyLimiter, validateBody(checkOtpSchema), verifyOtp);
authRouter.post("/refresh", refreshTokens);
authRouter.post("/logout", optionalAuth, logoutHandler);
authRouter.get("/me", requireAuth, me);
