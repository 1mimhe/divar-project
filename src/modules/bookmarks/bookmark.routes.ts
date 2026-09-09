import { Router } from "express";
import { validateObjectIdParam } from "../../common/middlewares/validate.ts";
import { requireAuth } from "../auth/auth.middleware.ts";
import { add, listMine, remove } from "./bookmark.controller.ts";

export const bookmarkRouter = Router();

bookmarkRouter.post(
  "/ads/:adId/bookmark",
  requireAuth,
  validateObjectIdParam("adId"),
  add,
);
bookmarkRouter.delete(
  "/ads/:adId/bookmark",
  requireAuth,
  validateObjectIdParam("adId"),
  remove,
);
bookmarkRouter.get("/me/bookmarks", requireAuth, listMine);

/**
 * @swagger
 * tags:
 *   - name: Bookmarks
 *     description: Saved ads, one row per user and ad
 *
 * /api/v1/ads/{adId}/bookmark:
 *   post:
 *     summary: Bookmark an ad (idempotent).
 *     tags: [Bookmarks]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bookmarked. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: Unknown ad. }
 *   delete:
 *     summary: Remove a bookmark.
 *     tags: [Bookmarks]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Removed. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: No such bookmark. }
 *
 * /api/v1/me/bookmarks:
 *   get:
 *     summary: The caller's bookmarks with ad cards.
 *     tags: [Bookmarks]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200: { description: Bookmark list (empty array when none). }
 *       401: { description: Missing or invalid token. }
 */
