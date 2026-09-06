import { Router } from "express";
import { optionalAuth, requireAuth } from "../../common/middlewares/auth.ts";
import { otpLimiter, verifyLimiter } from "../../common/middlewares/rateLimit.ts";
import { validateBody } from "../../common/middlewares/validate.ts";
import { logoutHandler, me, refresh, send, verify } from "./auth.controller.ts";
import { checkOtpSchema, sendOtpSchema } from "./auth.schema.ts";

export const authRouter = Router();

authRouter.post("/otp/send", otpLimiter, validateBody(sendOtpSchema), send);
authRouter.post("/otp/verify", verifyLimiter, validateBody(checkOtpSchema), verify);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", optionalAuth, logoutHandler);
authRouter.get("/me", requireAuth, me);
