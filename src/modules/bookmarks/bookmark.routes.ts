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
