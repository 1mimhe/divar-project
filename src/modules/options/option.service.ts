import slugify from "slugify";
import { ApiError } from "../../common/errors/ApiError.ts";
import { Category, requireCategory } from "../categories/category.model.ts";
import { Option, type OptionDoc } from "./option.model.ts";
import type { CreateOptionDto, UpdateOptionDto } from "./option.schema.ts";

/** Machine key: lowercase, `_` separators. */
export function toOptionKey(value: string): string {
  return slugify(value, { lower: true, replacement: "_" });
}

/** Options live on leaves — the categories ads post into. */
async function requireLeaf(categoryId: unknown): Promise<void> {
  if (await Category.exists({ parent: categoryId })) {
    throw ApiError.badRequest("Options can only be defined on leaf categories.");
  }
}

/**
 * Creates an option. Keys are unique per category; `enum` accepts an array
 * or a comma-separated string.
 */
export async function createOption(dto: CreateOptionDto): Promise<OptionDoc> {
  const category = await requireCategory(dto.category);
  await requireLeaf(category._id);

  const key = toOptionKey(dto.key);
  if (await Option.exists({ key, category: category._id })) {
    throw ApiError.conflict("Option key already exists in this category.", { field: "key" });
  }

  return Option.create({
    title: dto.title.trim(),
    key,
    type: dto.type,
    category: category._id,
    required: dto.required,
    enum: dto.enum,
    ...(dto.guide ? { guide: dto.guide } : {}),
  });
}

/** Options of one category. Empty leaves answer `[]`, not 404. */
export async function listOptionsByCategory(categoryId: string): Promise<OptionDoc[]> {
  const category = await requireCategory(categoryId);
  return Option.find({ category: category._id }, {}, { sort: { title: 1 } });
}

/** Finds one option with its category reference. */
export async function getOptionById(id: string): Promise<OptionDoc> {
  const option = await Option.findById(id).populate("category", "name slug");
  if (!option) throw ApiError.notFound("Option not found.");
  return option;
}

/** Options of the category addressed by slug. */
export async function listOptionsByCategorySlug(slug: string): Promise<OptionDoc[]> {
  const category = await Category.findOne({ slug });
  if (!category) throw ApiError.notFound("Category not found.");
  return listOptionsByCategory(String(category._id));
}

/** Every option. Empty answers `[]`, not 404. */
export async function listOptions(): Promise<OptionDoc[]> {
  return Option.find({}, {}, { sort: { title: 1 } }).populate("category", "name slug");
}

/**
 * Patches an option and returns the new document. Key conflicts exclude the
 * option itself; moving categories re-checks the leaf rule.
 */
export async function updateOption(id: string, patch: UpdateOptionDto): Promise<OptionDoc> {
  const option = await Option.findById(id);
  if (!option) throw ApiError.notFound("Option not found.");

  const categoryId = patch.category ? (await requireCategory(patch.category))._id : option.category;
  if (patch.category) await requireLeaf(categoryId);

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.required !== undefined) update.required = patch.required;
  if (patch.enum !== undefined) update.enum = patch.enum;
  if (patch.guide !== undefined) update.guide = patch.guide;
  if (patch.category !== undefined) update.category = categoryId;
  if (patch.key !== undefined) {
    const key = toOptionKey(patch.key);
    if (await Option.exists({ key, category: categoryId, _id: { $ne: option._id } })) {
      throw ApiError.conflict("Option key already exists in this category.", { field: "key" });
    }
    update.key = key;
  }

  const updated = await Option.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
  if (!updated) throw ApiError.notFound("Option not found.");
  return updated;
}

/** Deletes an option or throws 404. */
export async function removeOption(id: string): Promise<OptionDoc> {
  const deleted = await Option.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound("Option not found.");
  return deleted;
}
