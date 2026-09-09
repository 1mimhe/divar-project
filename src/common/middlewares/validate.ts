import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../errors/ApiError.ts";

type Source = "body" | "query" | "params";

/** Validate `req[source]` against a zod schema. On failure → 400 with field errors. */
export function validate(source: Source, schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(ApiError.badRequest("Validation failed.", parsed.error.flatten()));
      return;
    }
    (req as unknown as Record<string, unknown>)[source] = parsed.data;
    next();
  };
}

export const validateBody = (schema: z.ZodType) => validate("body", schema);
export const validateQuery = (schema: z.ZodType) => validate("query", schema);
export const validateParams = (schema: z.ZodType) => validate("params", schema);

/** 24-hex Mongo identifier. */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

/** Rejects malformed ids at the edge so handlers never see a CastError. */
export const validateObjectIdParam = (name: string) =>
  validateParams(z.object({ [name]: objectIdSchema }));
