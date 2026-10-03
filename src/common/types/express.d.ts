import type { AuthUser } from "../../modules/auth/auth.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
