import { Router } from "express";
import { validateBody } from "../../common/middlewares/validate.ts";
import { logoutHandler, me, refreshTokens, sendOtp, verifyOtp } from "./auth.controller.ts";
import { optionalAuth, requireAuth } from "./auth.middleware.ts";
import { otpLimiter, verifyLimiter } from "./auth.rateLimit.ts";
import { checkOtpSchema, sendOtpSchema } from "./auth.schema.ts";

export const authRouter = Router();

authRouter.post("/otp/send", otpLimiter, validateBody(sendOtpSchema), sendOtp);
authRouter.post("/otp/verify", verifyLimiter, validateBody(checkOtpSchema), verifyOtp);
authRouter.post("/refresh", refreshTokens);
authRouter.post("/logout", optionalAuth, logoutHandler);
authRouter.get("/me", requireAuth, me);

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: OTP login with rotating refresh sessions
 * components:
 *   schemas:
 *     SendOtp:
 *       type: object
 *       required: [mobile]
 *       properties:
 *         mobile: { type: string, example: "09123456789" }
 *     CheckOtp:
 *       type: object
 *       required: [mobile, code]
 *       properties:
 *         mobile: { type: string, example: "09123456789" }
 *         code: { type: string, example: "12345" }
 *     Session:
 *       type: object
 *       properties:
 *         message: { type: string }
 *         user: { $ref: '#/components/schemas/PublicUser' }
 *         accessToken: { type: string }
 *     PublicUser:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         mobile: { type: string }
 *         verifiedMobile: { type: boolean }
 *         isAdmin: { type: boolean }
 *
 * /api/v1/auth/otp/send:
 *   post:
 *     summary: Send a 5-digit login code (5/hour per IP).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/SendOtp' }
 *     responses:
 *       200:
 *         description: Code dispatched (`previewCode` only off-production).
 *       400:
 *         description: Invalid mobile.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } }
 *       429:
 *         description: Live code exists (`retryAfter`) or rate limited.
 *
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify a code and open a session (cookies + access token).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CheckOtp' }
 *     responses:
 *       200:
 *         description: Logged in; `access_token` + `refresh_token` cookies set.
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Session' } } }
 *       400:
 *         description: No pending code or malformed input.
 *       401:
 *         description: Wrong or expired code.
 *       429:
 *         description: Code locked after too many attempts.
 *
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rotate the refresh token (body or cookie).
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New pair issued; old refresh token is dead.
 *       400:
 *         description: No token presented.
 *       401:
 *         description: Unknown, expired or revoked token.
 *
 * /api/v1/auth/logout:
 *   post:
 *     summary: Revoke the session and clear cookies (always succeeds).
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out, cookies cleared. }
 *
 * /api/v1/auth/me:
 *   get:
 *     summary: Current caller.
 *     tags: [Auth]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The caller.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/PublicUser' }
 *       401:
 *         description: Missing or invalid token.
 */
