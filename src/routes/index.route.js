const {Router} = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");

allRouters.use("/auth", authRouter);

module.exports = allRouters;