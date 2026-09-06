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

export interface UserAttrs {
  fullName?: string;
  mobile: string;
  otp?: OtpSubdoc;
  verifiedMobile: boolean;
  isAdmin: boolean;
  refreshTokens: RefreshTokenSubdoc[];
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

const userSchema = new Schema<UserAttrs, UserModel>(
  {
    fullName: { type: String, required: false },
    mobile: { type: String, required: true, unique: true },
    otp: { type: otpSchema, required: false },
    verifiedMobile: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        // Secrets never serialize: login codes and session hashes stay in the DB.
        delete ret.otp;
        delete ret.refreshTokens;
        return ret;
      },
    },
  },
);

/** Finds by mobile or throws 404. */
userSchema.statics.findByMobile = async function (mobile: string): Promise<UserDoc> {
  const user = await this.findOne({ mobile });
  if (!user) throw ApiError.notFound("User Not Found.");
  return user as UserDoc;
};

export const User =
  (mongoose.models.User as UserModel | undefined) ??
  mongoose.model<UserAttrs, UserModel>("User", userSchema);
