import type { NextFunction, Request, Response } from "express";
import { getUserById, listUsers } from "./user.service.ts";

/** Lists users (admin). Secret fields are stripped by the model. */
export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ users: await listUsers() });
  } catch (err) {
    next(err);
  }
}

/** Shows one user (admin). */
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ user: await getUserById(req.params.id) });
  } catch (err) {
    next(err);
  }
}
