import type { UserDoc } from "../users/user.model.ts";

/** Authenticated caller attached to `req.user` by the auth middlewares. */
export interface AuthUser {
  id: string;
  mobile: string;
}

/** Payload of a short-lived access token. */
export interface AccessPayload {
  id: string;
  mobile: string;
}

/** Payload of a refresh token. `jti` keeps every issuance unique. */
export interface RefreshPayload {
  id: string;
  type: "refresh";
  jti?: string;
}

/** Result of requesting a code. `previewCode` is set off-production only. */
export interface OtpSent {
  retryAfter: number;
  previewCode?: string;
}

/** Freshly issued session tokens. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Verified login: tokens plus the public user profile. */
export interface VerifiedSession extends TokenPair {
  user: Pick<UserDoc, "_id" | "mobile" | "verifiedMobile">;
}
