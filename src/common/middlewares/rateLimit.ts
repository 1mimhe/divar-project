import { rateLimit } from "express-rate-limit";

/** 429 body matches the app's `{statusCode, error}` shape. */
function tooManyHandler(message: string) {
  return (_req: unknown, res: { status: (c: number) => { json: (b: unknown) => void } }) => {
    res.status(429).json({ statusCode: 429, error: { message } });
  };
}

/** OTP send: 5 requests / hour / IP. Brute-forceable 5-digit codes need a tight tap. */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyHandler("Too many OTP requests. Please try again later."),
});

/** OTP verify: 10 attempts / 10 min / IP — backstop behind the per-code attempt cap. */
export const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyHandler("Too many verification attempts. Please try again later."),
});
