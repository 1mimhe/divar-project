import { Router } from "express";
import { validateBody, validateObjectIdParam } from "../../common/middlewares/validate.ts";
import { requireAuth } from "../auth/auth.middleware.ts";
import { listMine, remove, save, show } from "./note.controller.ts";
import { upsertNoteSchema } from "./note.schema.ts";

export const noteRouter = Router();

noteRouter.post(
  "/ads/:adId/note",
  requireAuth,
  validateObjectIdParam("adId"),
  validateBody(upsertNoteSchema),
  save,
);
noteRouter.get("/ads/:adId/note", requireAuth, validateObjectIdParam("adId"), show);
noteRouter.delete("/ads/:adId/note", requireAuth, validateObjectIdParam("adId"), remove);
noteRouter.get("/me/notes", requireAuth, listMine);

/**
 * @swagger
 * tags:
 *   - name: Notes
 *     description: Private per-user notes, one per ad
 *
 * /api/v1/ads/{adId}/note:
 *   post:
 *     summary: Create or replace the caller's note (201 or 200).
 *     tags: [Notes]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 2000 }
 *     responses:
 *       200: { description: Note replaced. }
 *       201: { description: Note created. }
 *       400: { description: Bad input or malformed id. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: Unknown ad. }
 *   get:
 *     summary: Show the caller's note on one ad.
 *     tags: [Notes]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The note. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: No note on this ad. }
 *   delete:
 *     summary: Delete the caller's note on one ad.
 *     tags: [Notes]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: adId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: No note on this ad. }
 *
 * /api/v1/me/notes:
 *   get:
 *     summary: The caller's notes.
 *     tags: [Notes]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200: { description: Note list (empty array when none). }
 *       401: { description: Missing or invalid token. }
 */
