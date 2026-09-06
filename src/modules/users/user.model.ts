import mongoose, { type HydratedDocument, type Model, Schema } from "mongoose";
import { ApiError } from "../../common/errors/ApiError.ts";

export interface OtpSubdoc {
  code?: string;
  /** Epoch millis when the code expires. */
  expiresIn?: number;
  /** Failed verify attempts for the current code. Reset on every send. */
  attempts?: number;
}

export interface RefreshTokenSubdoc {
  /** sha256 hex of the refresh token. Never store the raw token. */
  hash: string;
  createdAt: Date;
}

export interface BookmarkSubdoc {
  adId: mongoose.Types.ObjectId;
  adTitle: string;
}

export interface NoteSubdoc {
  content: string;
  for: mongoose.Types.ObjectId;
  adTitle: string;
}

export interface UserAttrs {
  fullName?: string;
  mobile: string;
  otp?: OtpSubdoc;
  verifiedMobile: boolean;
  refreshTokens: RefreshTokenSubdoc[];
  bookmarks: BookmarkSubdoc[];
  notes: NoteSubdoc[];
}

export type UserDoc = HydratedDocument<UserAttrs>;

interface UserModel extends Model<UserAttrs> {
  findByMobile(mobile: string): Promise<UserDoc>;
}

const otpSchema = new Schema<OtpSubdoc>(
  {
    code: { type: String, required: false },
    expiresIn: { type: Number, required: false, default: 0 },
    attempts: { type: Number, required: false, default: 0 },
  },
  { _id: false },
);

const refreshTokenSchema = new Schema<RefreshTokenSubdoc>(
  {
    hash: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

// Carried over from the legacy model unchanged (domain rules land in Issue #3).
const bookmarkSchema = new Schema<BookmarkSubdoc>(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    adTitle: { type: String, required: true },
  },
  { _id: false },
);

// NOTE: the legacy model declares global `unique: true` on `for`. That index
// makes the SECOND user insert fail with E11000 `notes.for: null` (an empty
// `notes: []` is indexed as null), so it is deliberately NOT ported. Per-user
// note uniqueness becomes a compound index in Issue #3.
const noteSchema = new Schema<NoteSubdoc>(
  {
    content: { type: String, required: true },
    for: { type: Schema.Types.ObjectId, ref: "Ad", required: true },
    adTitle: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserAttrs, UserModel>(
  {
    fullName: { type: String, required: false },
    mobile: { type: String, required: true, unique: true },
    otp: { type: otpSchema, required: false },
    verifiedMobile: { type: Boolean, required: true, default: false },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    bookmarks: { type: [bookmarkSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.statics.findByMobile = async function (mobile: string): Promise<UserDoc> {
  const user = await this.findOne({ mobile });
  if (!user) throw ApiError.notFound("User Not Found.");
  return user as UserDoc;
};

export const User =
  (mongoose.models.User as UserModel | undefined) ??
  mongoose.model<UserAttrs, UserModel>("User", userSchema);
