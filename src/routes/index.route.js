const { Router } = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");
const userRouter = require("./user.route");
const categoryRouter = require("./category.route");
const optionRouter = require("./option.route");
const adRouter = require("./ad.route");
const AdController = require("../controllers/ad.controller");
const UserController = require("../controllers/user.controller");
const authorization = require("../middlewares/auth.middleware");

allRouters.get("/", AdController.getAllAds);
allRouters.get("/my", authorization, UserController.whoAmI);
allRouters.use("/auth", authRouter);
allRouters.use("/user", userRouter);
allRouters.use("/category", categoryRouter);
allRouters.use("/option", optionRouter);
allRouters.use("/ad", adRouter);

module.exports = allRouters;