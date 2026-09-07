import { Router } from "express";
import { ApiError } from "../common/errors/ApiError.ts";
import { clearAuthCookies, setAuthCookies } from "../modules/auth/auth.controller.ts";
import { REFRESH_COOKIE } from "../modules/auth/auth.constants.ts";
import { logout, sendOTP, verifyOTP } from "../modules/auth/auth.service.ts";
import { checkOtpSchema, sendOtpSchema } from "../modules/auth/auth.schema.ts";
import { optionalLogin } from "./guards.ts";

export const authViews = Router();

/** Login page. Already-authenticated visitors go home. */
authViews.get("/auth/login", optionalLogin, (req, res) => {
  if (req.user) {
    res.redirect("/");
    return;
  }
  res.render("auth.main.ejs", { operation: "send-otp" });
});

/** Dispatches the code and shows the verify form (re-rendered with errors). */
authViews.post("/auth/otp/send", async (req, res, next) => {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).render("auth.main.ejs", {
        operation: "send-otp",
        formError: "Mobile must match 09xxxxxxxxx.",
        input: req.body,
      });
      return;
    }
    const sent = await sendOTP(parsed.data.mobile);
    res.render("auth.main.ejs", {
      operation: "check-otp",
      mobile: parsed.data.mobile,
      previewCode: sent.previewCode,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      res.status(429).render("auth.main.ejs", {
        operation: "send-otp",
        formError: err.message,
        input: req.body,
      });
      return;
    }
    next(err);
  }
});

/** Verifies the code, opens the session and goes home. */
authViews.post("/auth/otp/verify", async (req, res, next) => {
  const mobile = typeof req.body?.mobile === "string" ? req.body.mobile : "";
  try {
    const parsed = checkOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).render("auth.main.ejs", {
        operation: "check-otp",
        mobile,
        formError: "Enter the 5-digit code.",
      });
      return;
    }
    const session = await verifyOTP(parsed.data.mobile, parsed.data.code);
    setAuthCookies(res, session);
    req.flash("success", "Welcome back.");
    res.redirect("/");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 429)) {
      res.status(err.status).render("auth.main.ejs", {
        operation: "check-otp",
        mobile,
        formError: err.message,
      });
      return;
    }
    next(err);
  }
});

/** Ends the session from any state and goes home. */
authViews.post("/auth/logout", optionalLogin, async (req, res, next) => {
  try {
    if (req.user) {
      const presented =
        (req.body?.refreshToken as string | undefined) ?? req.cookies?.[REFRESH_COOKIE];
      await logout(req.user.id, presented);
    }
    clearAuthCookies(res);
    req.flash("success", "Logged out.");
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});
