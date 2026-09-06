import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.ts";
import { logger } from "./config/logger.ts";
import { errorHandler, notFound } from "./common/middlewares/errorHandler.ts";
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

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
