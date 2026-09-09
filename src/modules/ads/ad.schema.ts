import { z } from "zod";
import { objectIdSchema } from "../../common/middlewares/validate.ts";
import { booleanish } from "../options/option.schema.ts";

/** `options` arrives as an object (JSON) or a JSON string (multipart forms). */
const optionsInput = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return value;
      }
    }
    return value;
  },
  z.record(z.string(), z.unknown()),
);

export const createAdSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  category: objectIdSchema,
  price: z.coerce.number().min(0, "Price cannot be negative.").default(0),
  province: z.string().trim().min(1, "Province is required."),
  city: z.string().trim().min(1, "City is required."),
  district: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  showNumber: booleanish,
  isActiveChat: booleanish,
  options: optionsInput.default({}),
});

export const listAdsQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Over-large pages are clamped, not rejected.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(20)
    .transform((value) => Math.min(value, 50)),
  sort: z.enum(["newest", "cheapest", "expensive"]).default("newest"),
});

export type CreateAdDto = z.infer<typeof createAdSchema>;
export type ListAdsQuery = z.infer<typeof listAdsQuerySchema>;
