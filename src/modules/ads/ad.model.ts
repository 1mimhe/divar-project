import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export interface AdAttrs {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId;
  price: number;
  images: string[];
  province: string;
  city: string;
  district?: string;
  address?: string;
  showNumber: boolean;
  isActiveChat: boolean;
  /** Validated values keyed by the category option `key`. */
  options: Map<string, unknown>;
  publishedBy: mongoose.Types.ObjectId;
}

export type AdDoc = HydratedDocument<AdAttrs>;
type AdModel = Model<AdAttrs>;

const adSchema = new Schema<AdAttrs, AdModel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    price: { type: Number, required: true, default: 0 },
    images: { type: [String], required: true, default: [] },
    province: { type: String, required: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: false },
    address: { type: String, required: false },
    showNumber: { type: Boolean, required: true, default: false },
    isActiveChat: { type: Boolean, required: true, default: false },
    options: { type: Map, of: Schema.Types.Mixed, required: true, default: {} },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

adSchema.index({ title: "text", description: "text" });

export const Ad =
  (mongoose.models.Ad as AdModel | undefined) ??
  mongoose.model<AdAttrs, AdModel>("Ad", adSchema);
