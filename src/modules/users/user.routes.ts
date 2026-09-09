import { Router } from "express";
import { validateObjectIdParam } from "../../common/middlewares/validate.ts";
import { requireAdmin, requireAuth } from "../auth/auth.middleware.ts";
import { list, show } from "./user.controller.ts";

export const userRouter = Router();

userRouter.use(requireAuth, requireAdmin);
userRouter.get("/", list);
userRouter.get("/:id", validateObjectIdParam("id"), show);

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Admin user directory (secrets never serialize)
 *
 * /api/v1/users:
 *   get:
 *     summary: List users (admin).
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Users without OTP or refresh-token fields.
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *
 * /api/v1/users/{id}:
 *   get:
 *     summary: Show one user (admin).
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: "^[0-9a-fA-F]{24}$" }
 *     responses:
 *       200: { description: The user. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *       404: { description: Unknown user. }
 */
