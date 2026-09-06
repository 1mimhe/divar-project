import { z } from "zod";
import { objectIdSchema } from "../../common/middlewares/validate.ts";
import { OPTION_TYPES } from "./option.model.ts";

/** Accepts real booleans and `"true"`/`"false"` form strings. Shared with ad input. */
export const booleanish = z.preprocess((value) => value === "true" || value === true, z.boolean());

/** Accepts an array or a comma-separated string. */
const enumish = z.union([
  z.array(z.unknown()),
  z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
]);

export const createOptionSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  key: z.string().trim().min(1, "Key is required."),
  type: z.enum(OPTION_TYPES),
  category: objectIdSchema,
  required: booleanish,
  enum: enumish.default([]),
  guide: z.string().trim().min(1).optional(),
});

export const updateOptionSchema = z.object({
  title: z.string().trim().min(1).optional(),
  key: z.string().trim().min(1).optional(),
  type: z.enum(OPTION_TYPES).optional(),
  category: objectIdSchema.optional(),
  required: booleanish.optional(),
  enum: enumish.optional(),
  guide: z.string().trim().min(1).optional(),
});

export type CreateOptionDto = z.infer<typeof createOptionSchema>;
export type UpdateOptionDto = z.infer<typeof updateOptionSchema>;
