import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.ts";
import { logger } from "../../config/logger.ts";
import { ApiError } from "../errors/ApiError.ts";

/** 404 for unmatched routes, in the app error shape. */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    statusCode: 404,
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
}

function toStatus(err: unknown): number {
  if (err instanceof ApiError) return err.status;
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    // Data-layer errors, duck-typed so `common` never imports Mongoose.
    if (record.name === "CastError") return 400;
    if (record.name === "ValidationError") return 400;
    if (record.code === 11000) return 409;
    const status = record.status ?? record.statusCode;
    if (typeof status === "number" && Number.isInteger(status) && status >= 400 && status < 600) {
      return status;
    }
  }
  return 500;
}

function toMessage(err: unknown, status: number): string {
  if (status < 500) return err instanceof Error ? err.message : "Bad Request";
  if (env.NODE_ENV !== "production") return err instanceof Error ? err.message : "Internal Server Error";
  return "Internal Server Error";
}

function toDetails(err: unknown): unknown {
  if (err instanceof ApiError) return err.details;
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    if (record.name === "ValidationError" && typeof record.errors === "object" && record.errors !== null) {
      const fields: Record<string, string> = {};
      for (const [field, entry] of Object.entries(record.errors as Record<string, unknown>)) {
        const message =
          typeof entry === "object" && entry !== null && "message" in entry
            ? String((entry as { message: unknown }).message)
            : String(entry);
        fields[field] = message;
      }
      return { fields };
    }
    if (record.code === 11000 && typeof record.keyValue === "object" && record.keyValue !== null) {
      const field = Object.keys(record.keyValue as Record<string, unknown>)[0];
      return field ? { field } : undefined;
    }
  }
  return undefined;
}

/**
 * Central error handler (must be last in the stack). 4xx stay silent;
 * 5xx are logged with the error. 500 messages are masked in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = toStatus(err);
  const message = toMessage(err, status);
  const details = toDetails(err);
  if (status >= 500) logger.error({ err }, "Unhandled error");
  res.status(status).json({
    statusCode: status,
    error: details === undefined ? { message } : { message, details },
  });
}
