import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export const OPTION_TYPES = ["number", "string", "boolean", "array"] as const;
export type OptionType = (typeof OPTION_TYPES)[number];

export interface OptionAttrs {
  title: string;
  /** Machine key, slugified with `_` separators. Unique per category. */
  key: string;
  type: OptionType;
  category: mongoose.Types.ObjectId;
  required: boolean;
  /** Allowed values for `array` (and optionally other) types. */
  enum: unknown[];
  guide?: string;
}

export type OptionDoc = HydratedDocument<OptionAttrs>;
type OptionModel = Model<OptionAttrs>;

const optionSchema = new Schema<OptionAttrs, OptionModel>({
  title: { type: String, required: true },
  key: { type: String, required: true },
  type: { type: String, enum: OPTION_TYPES, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  required: { type: Boolean, required: true, default: false },
  enum: { type: [Schema.Types.Mixed], required: true, default: [] },
  guide: { type: String, required: false },
});

optionSchema.index({ category: 1, key: 1 }, { unique: true });

export const Option =
  (mongoose.models.Option as OptionModel | undefined) ??
  mongoose.model<OptionAttrs, OptionModel>("Option", optionSchema);
