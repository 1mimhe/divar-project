import { Router } from "express";
import { validateBody, validateObjectIdParam } from "../common/middlewares/validate.ts";
import { bookmarkAd } from "../modules/bookmarks/bookmark.service.ts";
import { upsertNote } from "../modules/notes/note.service.ts";
import { upsertNoteSchema } from "../modules/notes/note.schema.ts";
import { requireLogin } from "./guards.ts";

export const adActions = Router();

/** Bookmarks from the ad page, then returns to it. */
adActions.post(
  "/a/:id/bookmark",
  requireLogin,
  validateObjectIdParam("id"),
  async (req, res, next) => {
    try {
      await bookmarkAd(req.user!.id, req.params.id);
      req.flash("success", "Ad bookmarked.");
      res.redirect(`/a/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  },
);

/** Saves the caller's note from the ad page, then returns to it. */
adActions.post(
  "/a/:id/note",
  requireLogin,
  validateObjectIdParam("id"),
  validateBody(upsertNoteSchema),
  async (req, res, next) => {
    try {
      const { content } = req.body as { content: string };
      await upsertNote(req.user!.id, req.params.id, content);
      req.flash("success", "Note saved.");
      res.redirect(`/a/${req.params.id}`);
    } catch (err) {
      next(err);
    }
  },
);
