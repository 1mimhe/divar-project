import { Router } from "express";
import {
  validateBody,
  validateObjectIdParam,
  validateParams,
} from "../../common/middlewares/validate.ts";
import { requireAdmin, requireAuth } from "../auth/auth.middleware.ts";
import { slugParamSchema } from "../categories/category.schema.ts";
import {
  create,
  list,
  listByCategory,
  listByCategorySlug,
  remove,
  show,
  update,
} from "./option.controller.ts";
import { createOptionSchema, updateOptionSchema } from "./option.schema.ts";

export const optionRouter = Router();

// Specific paths first: they would otherwise match `/:id`.
optionRouter.get(
  "/by-category/:categoryId",
  validateObjectIdParam("categoryId"),
  listByCategory,
);
optionRouter.get("/by-category-slug/:slug", validateParams(slugParamSchema), listByCategorySlug);
optionRouter.get("/:id", validateObjectIdParam("id"), show);
optionRouter.get("/", list);
optionRouter.post("/", requireAuth, requireAdmin, validateBody(createOptionSchema), create);
optionRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateObjectIdParam("id"),
  validateBody(updateOptionSchema),
  update,
);
optionRouter.delete("/:id", requireAuth, requireAdmin, validateObjectIdParam("id"), remove);

/**
 * @swagger
 * tags:
 *   - name: Options
 *     description: Typed per-category ad attributes (leaf categories only)
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string, example: "Kilometers" }
 *         key: { type: string, example: "km" }
 *         type: { type: string, enum: [number, string, boolean, array] }
 *         category: { type: string }
 *         required: { type: boolean }
 *         enum: { type: array, items: {} }
 *         guide: { type: string }
 *     CreateOption:
 *       type: object
 *       required: [title, key, type, category]
 *       properties:
 *         title: { type: string }
 *         key: { type: string, description: "Slugified with _ separators." }
 *         type: { type: string, enum: [number, string, boolean, array] }
 *         category: { type: string, description: "Must be a leaf category." }
 *         required: { type: boolean }
 *         enum: { type: array, items: {}, description: "Or a comma-separated string." }
 *         guide: { type: string }
 *
 * /api/v1/options:
 *   get:
 *     summary: Every option.
 *     tags: [Options]
 *     responses:
 *       200: { description: Option list (empty array when none). }
 *   post:
 *     summary: Define an option on a leaf category (admin).
 *     tags: [Options]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateOption' }
 *     responses:
 *       201: { description: Created. }
 *       400: { description: Bad input or non-leaf category. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *       404: { description: Unknown category. }
 *       409: { description: Key taken in this category. }
 *
 * /api/v1/options/by-category/{categoryId}:
 *   get:
 *     summary: Options of one category.
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Option list. }
 *       400: { description: Malformed id. }
 *       404: { description: Unknown category. }
 *
 * /api/v1/options/by-category-slug/{slug}:
 *   get:
 *     summary: Options of the category addressed by slug.
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Option list. }
 *       404: { description: Unknown category. }
 *
 * /api/v1/options/{id}:
 *   get:
 *     summary: Show one option.
 *     tags: [Options]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The option. }
 *       400: { description: Malformed id. }
 *       404: { description: Unknown option. }
 *   put:
 *     summary: Patch an option, answers the new document (admin).
 *     tags: [Options]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateOption' }
 *     responses:
 *       200: { description: Updated. }
 *       400: { description: Bad input. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *       404: { description: Unknown option. }
 *       409: { description: Key taken in this category. }
 *   delete:
 *     summary: Delete an option (admin).
 *     tags: [Options]
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
 *       403: { description: Admin only. }
 *       404: { description: Unknown option. }
 */
