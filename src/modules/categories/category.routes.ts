import { Router } from "express";
import { validateBody, validateObjectIdParam, validateQuery } from "../../common/middlewares/validate.ts";
import { requireAdmin, requireAuth } from "../auth/auth.middleware.ts";
import { create, list, remove } from "./category.controller.ts";
import { createCategorySchema, listCategoriesQuerySchema } from "./category.schema.ts";

export const categoryRouter = Router();

categoryRouter.get("/", validateQuery(listCategoriesQuerySchema), list);
categoryRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createCategorySchema),
  create,
);
categoryRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validateObjectIdParam("id"),
  remove,
);

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category tree (options live on leaves)
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string, example: "Sedans" }
 *         slug: { type: string, example: "sedans" }
 *         icon: { type: string, example: "car.svg" }
 *         parent: { type: string, nullable: true }
 *         parents: { type: array, items: { type: string } }
 *     CreateCategory:
 *       type: object
 *       required: [name, icon]
 *       properties:
 *         name: { type: string }
 *         slug: { type: string, description: "Optional kebab-case; derived from name." }
 *         icon: { type: string }
 *         parent: { type: string, description: "Parent id; must be option-free." }
 *
 * /api/v1/categories:
 *   get:
 *     summary: Root categories, or the nested tree with ?tree=true.
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: tree
 *         schema: { type: string, enum: [true, false], default: false }
 *     responses:
 *       200: { description: Category list or tree. }
 *       400: { description: Bad query. }
 *   post:
 *     summary: Create a category (admin).
 *     tags: [Categories]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCategory' }
 *     responses:
 *       201:
 *         description: Created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category: { $ref: '#/components/schemas/Category' }
 *       400: { description: Bad input or option-bearing parent. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *       409: { description: Slug taken. }
 *
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a subtree with its options (admin). Blocked by ads.
 *     tags: [Categories]
 *     security: [{ cookieAuth: [] }, { bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deletion counts. }
 *       400: { description: Malformed id. }
 *       401: { description: Missing or invalid token. }
 *       403: { description: Admin only. }
 *       404: { description: Unknown category. }
 *       409: { description: Subtree still has ads. }
 */
