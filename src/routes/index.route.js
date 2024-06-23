const {Router} = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");
const userRouter = require("./user.route");
const categoryRouter = require("./category.route");
const optionRouter = require("../routes/option.route");

allRouters.use("/auth", authRouter);
allRouters.use("/user", userRouter);
allRouters.use("/category", categoryRouter);
allRouters.use("/option", optionRouter);
allRouters.get("/", (req, res, next) => {
    res.render('panel.main.ejs');
});

module.exports = allRouters;