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
