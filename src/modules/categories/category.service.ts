import slugify from "slugify";
import { ApiError } from "../../common/errors/ApiError.ts";
import { Ad } from "../ads/ad.model.ts";
import { Option } from "../options/option.model.ts";
import { Category, requireCategory, type CategoryDoc, type CategoryNode } from "./category.model.ts";
import type { CreateCategoryDto } from "./category.schema.ts";

/** Local slug: lowercase kebab-case, no network, no surprises. */
export function toSlug(value: string): string {
  return slugify(value, { lower: true, strict: true });
}

/**
 * Creates a category. Slugs must be unique; a parent must exist and must not
 * define options itself (options live on leaves, the categories ads post into).
 */
export async function createCategory(dto: CreateCategoryDto): Promise<CategoryDoc> {
  const slug = toSlug(dto.slug ?? dto.name);
  if (await Category.findBySlug(slug)) {
    throw ApiError.conflict("Slug already exists.", { field: "slug" });
  }

  let parent: CategoryDoc | undefined;
  let parents: CategoryDoc["parents"] = [];
  if (dto.parent) {
    parent = await requireCategory(dto.parent);
    if (await Option.exists({ category: parent._id })) {
      throw ApiError.badRequest("A category with options cannot gain children.");
    }
    parents = [...parent.parents, parent._id];
  }

  return Category.create({
    name: dto.name.trim(),
    slug,
    icon: dto.icon.trim(),
    ...(parent ? { parent: parent._id, parents } : { parents: [] }),
  });
}

/** Lists root categories, or the whole tree when `tree` is set. */
export async function listCategories(tree: boolean): Promise<CategoryDoc[] | CategoryNode[]> {
  const categories = await Category.find(tree ? {} : { parent: null }, {}, { sort: { name: 1 } }).lean();
  if (!tree) return categories as CategoryDoc[];
  return buildTree(categories);
}

function buildTree(
  categories: Array<{ _id: unknown; name: string; slug: string; icon: string; parent?: unknown }>,
): CategoryNode[] {
  const key = (id: unknown): string => String(id);
  const nodes = new Map<string, CategoryNode>();
  for (const category of categories) {
    nodes.set(key(category._id), {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      parent: category.parent ?? undefined,
      children: [],
    });
  }
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent == null ? undefined : nodes.get(key(node.parent));
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export interface CategoryDeletion {
  categories: number;
  options: number;
}

/**
 * Deletes a category with its descendants and their options.
 * @throws {ApiError} 404 for unknown ids, 409 while ads reference the subtree.
 */
export async function deleteCategory(id: string): Promise<CategoryDeletion> {
  const category = await requireCategory(id);
  const descendantIds = (
    await Category.find({ parents: category._id }, { _id: 1 }).lean()
  ).map((doc) => doc._id);
  const subtree = [category._id, ...descendantIds];

  const ads = await Ad.countDocuments({ category: { $in: subtree } });
  if (ads > 0) {
    throw ApiError.conflict("Category has ads and cannot be deleted.", { ads });
  }

  const { deletedCount: options } = await Option.deleteMany({ category: { $in: subtree } });
  const { deletedCount: categories } = await Category.deleteMany({ _id: { $in: subtree } });
  return { categories, options };
}
