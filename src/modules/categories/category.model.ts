import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";
import { ApiError } from "../../common/errors/ApiError.ts";

export interface CategoryAttrs {
  name: string;
  slug: string;
  icon: string;
  parent?: mongoose.Types.ObjectId;
  /** Materialized ancestor chain (root-first) for subtree queries. */
  parents: mongoose.Types.ObjectId[];
}

export type CategoryDoc = HydratedDocument<CategoryAttrs>;

/** Nested view of a category with its children attached. */
export interface CategoryNode {
  _id: unknown;
  name: string;
  slug: string;
  icon: string;
  parent?: unknown;
  children: CategoryNode[];
}

interface CategoryModel extends Model<CategoryAttrs> {
  findBySlug(slug: string): Promise<CategoryDoc | null>;
}

const categorySchema = new Schema<CategoryAttrs, CategoryModel>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", required: false },
    parents: { type: [Schema.Types.ObjectId], required: true, default: [] },
  },
  { timestamps: true },
);

categorySchema.statics.findBySlug = function (slug: string): Promise<CategoryDoc | null> {
  return this.findOne({ slug });
};

export const Category =
  (mongoose.models.Category as CategoryModel | undefined) ??
  mongoose.model<CategoryAttrs, CategoryModel>("Category", categorySchema);

/** Throws 404 unless the id belongs to a category. */
export async function requireCategory(id: string): Promise<CategoryDoc> {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound("Category not found.");
  return category;
}
