import { z } from "zod";
import { objectIdSchema } from "../../common/middlewares/validate.ts";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case.")
    .optional(),
  icon: z.string().trim().min(1, "Icon is required."),
  parent: objectIdSchema.optional(),
});

export const listCategoriesQuerySchema = z.object({
  tree: z.enum(["true", "false"]).default("false"),
});

/** Kebab-case slug path segment, shared by slug-addressed lookups. */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case."),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
