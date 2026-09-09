import { Router } from "express";
import {
  validateBody,
  validateObjectIdParam,
  validateQuery,
} from "../../common/middlewares/validate.ts";
import { requireAuth } from "../auth/auth.middleware.ts";
import { upload } from "../uploads/upload.ts";
import { create, list, mine, remove, show } from "./ad.controller.ts";
import { createAdSchema, listAdsQuerySchema } from "./ad.schema.ts";

export const adRouter = Router();

adRouter.get("/", validateQuery(listAdsQuerySchema), list);
adRouter.get("/mine", requireAuth, mine);
adRouter.get("/:id", validateObjectIdParam("id"), show);
adRouter.post(
  "/",
  requireAuth,
  upload.array("images", 10),
  validateBody(createAdSchema),
  create,
);
adRouter.delete("/:id", requireAuth, validateObjectIdParam("id"), remove);

/**
 * @swagger
 * tags:
 *   - name: Ads
 *     description: Owner ads with strictly validated category options
 * components:
 *   schemas:
 *     Ad:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         category: { type: object }
 *         price: { type: number }
 *         images: { type: array, items: { type: string } }
 *         province: { type: string }
 *         city: { type: string }
 *         district: { type: string }
 *         address: { type: string }
 *         showNumber: { type: boolean }
 *         isActiveChat: { type: boolean }
 *         options: { type: object, description: "Validated values keyed by option key." }
 *         publishedBy: { type: object }
 *     CreateAd:
 *       type: object
 *       required: [title, description, category, province, city]
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         category: { type: string, description: "Must be a leaf category." }
 *         price: { type: number, default: 0 }
 *         province: { type: string }
 *         city: { type: string }
 *         district: { type: string }
 *         address: { type: string }
 *         showNumber: { type: boolean }
 *         isActiveChat: { type: boolean }
 *         options: { type: object, description: "Values keyed by option key." }
 *
 * /api/v1/ads:
 *   get:
 *     summary: Search ads with pagination.
 *     tags: [Ads]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, description: "Literal match on title/description." }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string, description: "Category slug, subtree included." }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, description: "Clamped to 50." }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, cheapest, expensive], default: newest }
 *     responses:
 *       200:
 *         description: Pagination envelope.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Page'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Ad' }
 *       400: { description: Bad query. }
 *       404: { description: Unknown category slug. }
 *   post:
 *     summary: Post an ad (multipart, up to 10 images at 3 MB).
 *     tags: [Ads]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { $ref: '#/components/schemas/CreateAd' }
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateAd' }
 *     responses:
 *       201: { description: Created. }
 *       400: { description: Bad input, unknown option key, or bad file. }
 *       401: { description: Missing or invalid token. }
 *       404: { description: Unknown category. }
 *
 * /api/v1/ads/mine:
 *   get:
 *     summary: The caller's ads.
 *     tags: [Ads]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     responses:
 *       200: { description: Own ads, newest first. }
 *       401: { description: Missing or invalid token. }
 *
 * /api/v1/ads/{id}:
 *   get:
 *     summary: Show one ad with category and owner contact.
 *     tags: [Ads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The ad. }
 *       400: { description: Malformed id. }
 *       404: { description: Unknown ad. }
 *   delete:
 *     summary: Delete an ad with its files (owner or admin).
 *     tags: [Ads]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Not the owner. }
 *       404: { description: Unknown ad. }
 */
