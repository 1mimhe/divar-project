const {Router} = require('express');
const authRouter = Router();
const authController = require("../controllers/auth.controller");
const authorization = require("../middlewares/auth.middleware")

authRouter.post("/send-otp", authController.sendOTP);
authRouter.post("/check-otp", authController.checkOTP);
authRouter.get("/logout", authorization, authController.logOut);

module.exports = authRouter;