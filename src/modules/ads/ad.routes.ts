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
