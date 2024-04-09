const {Router} = require('express');
const authRouter = Router();
const authController = require("../controllers/auth.controller");

authRouter.post("/send-otp", authController.sendOTP);
authRouter.post("/check-otp", authController.checkOTP);

module.exports = authRouter;