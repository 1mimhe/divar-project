const {Router} = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");
const userRouter = require("./user.route");
const categoryRouter = require("./category.route");

allRouters.use("/auth", authRouter);
allRouters.use("/user", userRouter);
allRouters.use("/category", categoryRouter);

module.exports = allRouters;