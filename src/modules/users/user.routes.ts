import { Router } from "express";
import { validateObjectIdParam } from "../../common/middlewares/validate.ts";
import { requireAdmin, requireAuth } from "../auth/auth.middleware.ts";
import { list, show } from "./user.controller.ts";

export const userRouter = Router();

userRouter.use(requireAuth, requireAdmin);
userRouter.get("/", list);
userRouter.get("/:id", validateObjectIdParam("id"), show);
