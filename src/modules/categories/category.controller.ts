import type { NextFunction, Request, Response } from "express";
import { createCategory, deleteCategory, listCategories } from "./category.service.ts";
import type { CreateCategoryDto } from "./category.schema.ts";

/** Creates a category (admin). Answers 201 with the created document. */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await createCategory(req.body as CreateCategoryDto);
    res.status(201).json({ message: "Category created.", category });
  } catch (err) {
    next(err);
  }
}

/** Lists root categories, or the nested tree with `?tree=true`. */
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await listCategories(req.query.tree === "true");
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

/** Deletes a category subtree with its options (admin). Blocked while ads exist. */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await deleteCategory(req.params.id);
    res.status(200).json({ message: "Category deleted.", deleted });
  } catch (err) {
    next(err);
  }
}
