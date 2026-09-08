import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";

export interface NoteAttrs {
  user: mongoose.Types.ObjectId;
  ad: mongoose.Types.ObjectId;
  content: string;
  adTitle: string;
}

export type NoteDoc = HydratedDocument<NoteAttrs>;
type NoteModel = Model<NoteAttrs>;

const noteSchema = new Schema<NoteAttrs, NoteModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ad: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    content: { type: String, required: true, maxlength: 2000 },
    adTitle: { type: String, required: true },
  },
  { timestamps: true },
);

// One note per (user, ad): any user can note any ad, exactly once (upserted).
noteSchema.index({ user: 1, ad: 1 }, { unique: true });

export const Note =
  (mongoose.models.Note as NoteModel | undefined) ??
  mongoose.model<NoteAttrs, NoteModel>("Note", noteSchema);
