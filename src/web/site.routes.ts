import { Router } from "express";
import { ApiError } from "../common/errors/ApiError.ts";
import { validateObjectIdParam } from "../common/middlewares/validate.ts";
import { getAdById, listAds } from "../modules/ads/ad.service.ts";
import { listAdsQuerySchema } from "../modules/ads/ad.schema.ts";
import { listCategories } from "../modules/categories/category.service.ts";
import type { CategoryNode } from "../modules/categories/category.model.ts";
import { listOptionsByCategory } from "../modules/options/option.service.ts";
import { getNote } from "../modules/notes/note.service.ts";
import { optionalLogin } from "./guards.ts";
import { idOf } from "./helpers.ts";

export const siteRouter = Router();
siteRouter.use(optionalLogin);

function findNode(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findNode(node.children, slug);
    if (found) return found;
  }
  return undefined;
}

/** Public home: filterable ad grid with the category sidebar. */
siteRouter.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const city = typeof req.query.city === "string" ? req.query.city : undefined;
    const slug = typeof req.query.category === "string" ? req.query.category : undefined;
    const page = await listAds(
      listAdsQuerySchema.parse({ search, city, category: slug, limit: 60 }),
    );
    const tree = (await listCategories(true)) as CategoryNode[];
    const selected = slug ? findNode(tree, slug) : undefined;
    if (slug && !selected) throw ApiError.notFound("Category not found.");
    res.render("website.main.ejs", {
      operation: "home",
      ads: page.data,
      search: search ?? "",
      city: city ?? "",
      category: selected ?? null,
      roots: tree,
    });
  } catch (err) {
    next(err);
  }
});

/** Public ad detail with swiper gallery, option table and the caller's note. */
siteRouter.get("/a/:id", validateObjectIdParam("id"), async (req, res, next) => {
  try {
    const ad = await getAdById(req.params.id);
    const definitions = await listOptionsByCategory(idOf(ad.category));
    let note = "";
    if (req.user) {
      try {
        note = (await getNote(req.user.id, req.params.id)).content;
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 404) throw err;
      }
    }
    res.render("website.main.ejs", {
      operation: "show-ad",
      ad,
      note,
      options: Array.from(ad.options ?? []),
      optionTitles: new Map(definitions.map((definition) => [definition.key, definition.title])),
      search: "",
      city: typeof ad.city === "string" ? ad.city : "",
      category: ad.category,
      roots: [],
    });
  } catch (err) {
    next(err);
  }
});
