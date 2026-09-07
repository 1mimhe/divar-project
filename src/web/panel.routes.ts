import { Router } from "express";
import type { Response } from "express";
import { ApiError } from "../common/errors/ApiError.ts";
import { validateObjectIdParam } from "../common/middlewares/validate.ts";
import {
  countAds,
  createAd,
  deleteAdById,
  listMyAds,
} from "../modules/ads/ad.service.ts";
import { createAdSchema } from "../modules/ads/ad.schema.ts";
import {
  getCategoryBySlug,
  listCategories,
} from "../modules/categories/category.service.ts";
import { Category, type CategoryDoc } from "../modules/categories/category.model.ts";
import { listOptionsByCategory } from "../modules/options/option.service.ts";
import type { OptionDoc } from "../modules/options/option.model.ts";
import { listBookmarks, unbookmarkAd } from "../modules/bookmarks/bookmark.service.ts";
import { deleteNote, listNotes } from "../modules/notes/note.service.ts";
import { upload, toWebPath } from "../modules/uploads/upload.ts";
import { requireLogin } from "./guards.ts";

export const panelRouter = Router();
panelRouter.use(requireLogin);

/** Dashboard: platform total plus the caller's ads. */
panelRouter.get("/", async (req, res, next) => {
  try {
    const [total, myAds] = await Promise.all([countAds(), listMyAds(req.user!.id)]);
    res.render("panel.main.ejs", { operation: "home", totalAds: total, myAds });
  } catch (err) {
    next(err);
  }
});

/** Create form: category browser, then the leaf form. */
panelRouter.get("/ads/new", async (req, res, next) => {
  try {
    const slug = typeof req.query.slug === "string" ? req.query.slug : undefined;
    if (!slug || slug === "root") {
      const categories = (await listCategories(false)) as CategoryDoc[];
      res.render("panel.main.ejs", {
        operation: "create-ad",
        category: null,
        categories,
        options: [],
      });
      return;
    }
    const category = await getCategoryBySlug(slug.trim());
    const children = await Category.find({ parent: category._id }).lean();
    if (children.length > 0) {
      res.render("panel.main.ejs", {
        operation: "create-ad",
        category,
        categories: children,
        options: [],
      });
      return;
    }
    const options = await listOptionsByCategory(String(category._id));
    res.render("panel.main.ejs", { operation: "create-ad", category, categories: [], options });
  } catch (err) {
    next(err);
  }
});

/** Renders the leaf form again with the error and the submitted values. */
async function renderNewAdAgain(
  res: Response,
  status: number,
  categoryId: string | undefined,
  formError: string,
  input: Record<string, unknown>,
): Promise<void> {
  let category: CategoryDoc | null = null;
  let options: OptionDoc[] = [];
  if (categoryId) {
    try {
      category = (await Category.findById(categoryId).lean()) as CategoryDoc | null;
      if (category) options = await listOptionsByCategory(String(category._id));
    } catch {
      category = null;
    }
  }
  res.status(status).render("panel.main.ejs", {
    operation: "create-ad",
    category,
    categories: [],
    options,
    formError,
    input,
  });
}

/** Publishes an ad from the panel form (multipart). */
panelRouter.post("/ads", (req, res, next) => {
  upload.array("images", 10)(req, res, async (err: unknown) => {
    try {
      if (err) throw err;
      const body = req.body as Record<string, unknown>;
      const categoryId = typeof body.category === "string" ? body.category : undefined;
      const definitions = categoryId ? await listOptionsByCategory(categoryId) : [];
      const options: Record<string, unknown> = {};
      for (const definition of definitions) {
        const value = body[definition.key];
        if (value !== undefined && value !== "") options[definition.key] = value;
      }
      const parsed = createAdSchema.safeParse({ ...body, options });
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        await renderNewAdAgain(
          res,
          422,
          categoryId,
          `Invalid field: ${first.path.join(".") || "form"}.`,
          body,
        );
        return;
      }
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      await createAd({
        ownerId: req.user!.id,
        dto: parsed.data,
        images: files.map((file) => toWebPath(file.path)),
      });
      req.flash("success", "Ad published.");
      res.redirect("/panel/ads");
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        const body = (req.body ?? {}) as Record<string, unknown>;
        const categoryId = typeof body.category === "string" ? body.category : undefined;
        await renderNewAdAgain(res, error.status, categoryId, error.message, body);
        return;
      }
      next(error);
    }
  });
});

/** The caller's ads with flashed messages. */
panelRouter.get("/ads", async (req, res, next) => {
  try {
    res.render("panel.main.ejs", { operation: "show-ads", ads: await listMyAds(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

/** Deletes an owned ad from the panel. */
panelRouter.post("/ads/:id/delete", validateObjectIdParam("id"), async (req, res, next) => {
  try {
    await deleteAdById(req.params.id, { id: req.user!.id, isAdmin: req.user!.isAdmin });
    req.flash("success", "Ad deleted.");
    res.redirect("/panel/ads");
  } catch (err) {
    next(err);
  }
});

/** The caller's bookmarks. */
panelRouter.get("/bookmarks", async (req, res, next) => {
  try {
    res.render("panel.main.ejs", {
      operation: "bookmarks",
      bookmarks: await listBookmarks(req.user!.id),
    });
  } catch (err) {
    next(err);
  }
});

/** Removes one bookmark from the panel. */
panelRouter.post(
  "/bookmarks/:adId/remove",
  validateObjectIdParam("adId"),
  async (req, res, next) => {
    try {
      await unbookmarkAd(req.user!.id, req.params.adId);
      req.flash("success", "Bookmark removed.");
      res.redirect("/panel/bookmarks");
    } catch (err) {
      next(err);
    }
  },
);

/** The caller's notes. */
panelRouter.get("/notes", async (req, res, next) => {
  try {
    res.render("panel.main.ejs", { operation: "notes", notes: await listNotes(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

/** Deletes one note from the panel. */
panelRouter.post("/notes/:adId/remove", validateObjectIdParam("adId"), async (req, res, next) => {
  try {
    await deleteNote(req.user!.id, req.params.adId);
    req.flash("success", "Note deleted.");
    res.redirect("/panel/notes");
  } catch (err) {
    next(err);
  }
});
