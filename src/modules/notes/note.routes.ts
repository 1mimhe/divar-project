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
