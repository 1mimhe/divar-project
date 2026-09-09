import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export interface BookmarkAttrs {
  user: mongoose.Types.ObjectId;
  ad: mongoose.Types.ObjectId;
  adTitle: string;
}

export type BookmarkDoc = HydratedDocument<BookmarkAttrs>;
type BookmarkModel = Model<BookmarkAttrs>;

const bookmarkSchema = new Schema<BookmarkAttrs, BookmarkModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    adTitle: { type: String, required: true },
  },
  { timestamps: true },
);

// One bookmark per (user, ad): duplicates are rejected at the DB level.
bookmarkSchema.index({ user: 1, ad: 1 }, { unique: true });

export const Bookmark =
  (mongoose.models.Bookmark as BookmarkModel | undefined) ??
  mongoose.model<BookmarkAttrs, BookmarkModel>("Bookmark", bookmarkSchema);
