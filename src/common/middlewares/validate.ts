import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../errors/ApiError.ts";

type Source = "body" | "query" | "params";

/** Validate `req[source]` against a zod schema. On failure → 400 with field errors. */
export function validate(source: Source, schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(ApiError.badRequest("Validation failed.", parsed.error.flatten()));
      return;
    }
    (req as Record<string, unknown>)[source] = parsed.data;
    next();
  };
}

export const validateBody = (schema: z.ZodTypeAny) => validate("body", schema);
export const validateQuery = (schema: z.ZodTypeAny) => validate("query", schema);
export const validateParams = (schema: z.ZodTypeAny) => validate("params", schema);
