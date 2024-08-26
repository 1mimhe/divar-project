const {Router} = require('express');
const allRouters = Router();
const authRouter = require("./auth.route");
const userRouter = require("./user.route");
const categoryRouter = require("./category.route");
const optionRouter = require("./option.route");
const adRouter = require("./ad.route");

allRouters.use("/auth", authRouter);
allRouters.use("/user", userRouter);
allRouters.use("/category", categoryRouter);
allRouters.use("/option", optionRouter);
allRouters.use("/ad", adRouter);

allRouters.get("/", (req, res, next) => {
    res.render('website.main.ejs');
});

allRouters.get("/panel", (req, res, next) => {
    res.render('panel.main.ejs', {
        operation: "home"
    });
});

allRouters.get("/login", (req, res, next) => {
    res.render('auth.main.ejs');
});

module.exports = allRouters;