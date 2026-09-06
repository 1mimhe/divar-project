import { rateLimit, type RateLimitExceededEventHandler } from "express-rate-limit";

/** 429 body matches the app's `{statusCode, error}` shape. */
function tooManyHandler(message: string): RateLimitExceededEventHandler {
  return (_req, res) => {
    res.status(429).json({ statusCode: 429, error: { message } });
  };
}

export interface ApiLimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
}

/** Builds an IP rate limiter that answers 429s in the app's error shape. */
export function createApiLimiter({ windowMs, limit, message }: ApiLimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: tooManyHandler(message),
  });
}
