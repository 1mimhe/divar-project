const {Router} = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");
const userRouter = require("./user.route");

allRouters.use("/auth", authRouter);
allRouters.use("/user", userRouter);

module.exports = allRouters;