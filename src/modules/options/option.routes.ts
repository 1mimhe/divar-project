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
