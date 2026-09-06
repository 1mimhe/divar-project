import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.ts";
import { logger } from "./config/logger.ts";
import { authRouter } from "./modules/auth/auth.routes.ts";

export function createExpressApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_PRIVATE_KEY));
  app.use(pinoHttp({ logger }));
  app.use(express.static("public"));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", env: env.NODE_ENV });
  });

  app.use("/api/v1/auth", authRouter);

  // 404 — JSON for /api/*, JSON fallback for pages until EJS split (Issue #4)
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      statusCode: 404,
      error: { message: `Route ${req.method} ${req.path} not found` },
    });
  });

  // Central error handler (must be last, 4 args)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const rawStatus =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    const status = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const details =
      typeof err === "object" && err !== null && "details" in err
        ? (err as { details: unknown }).details
        : undefined;
    // 4xx are routine client errors; only 5xx get logged.
    if (status >= 500) logger.error({ err }, "Unhandled error");
    res.status(status).json({
      statusCode: status,
      error: details === undefined ? { message } : { message, details },
    });
  });

  return app;
}
