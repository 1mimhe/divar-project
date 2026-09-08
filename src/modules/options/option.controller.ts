import type { NextFunction, Request, Response } from "express";
import {
  createOption,
  getOptionById,
  listOptions,
  listOptionsByCategory,
  listOptionsByCategorySlug,
  removeOption,
  updateOption,
} from "./option.service.ts";
import type { CreateOptionDto, UpdateOptionDto } from "./option.schema.ts";

/** Creates an option (admin). Answers 201 with the created document. */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const option = await createOption(req.body as CreateOptionDto);
    res.status(201).json({ message: "Option created.", option });
  } catch (err) {
    next(err);
  }
}

/** Options of one category. */
export async function listByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const options = await listOptionsByCategory(req.params.categoryId);
    res.status(200).json({ options });
  } catch (err) {
    next(err);
  }
}

/** Options of the category addressed by slug. */
export async function listByCategorySlug(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const options = await listOptionsByCategorySlug(req.params.slug);
    res.status(200).json({ options });
  } catch (err) {
    next(err);
  }
}

/** Shows one option. */
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const option = await getOptionById(req.params.id);
    res.status(200).json({ option });
  } catch (err) {
    next(err);
  }
}

/** Lists every option. */
export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ options: await listOptions() });
  } catch (err) {
    next(err);
  }
}

/** Patches an option (admin). Answers with the updated document. */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const option = await updateOption(req.params.id, req.body as UpdateOptionDto);
    res.status(200).json({ message: "Option updated.", option });
  } catch (err) {
    next(err);
  }
}

/** Deletes an option (admin). */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await removeOption(req.params.id);
    res.status(200).json({ message: "Option deleted.", deleted });
  } catch (err) {
    next(err);
  }
}
