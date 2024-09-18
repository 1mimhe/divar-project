const authService = require("../services/auth.service");
const authMessages = require("../constants/auth.messages");
const NodeEnv = require("../constants/env.enum");
const cookieNames = require("../constants/cookie.enum");

async function sendOTP(req, res, next) {
    try {
        const { mobile } = req.body;
        await authService.sendOTP(mobile);

        res.render("auth.main.ejs", {
            operation: "check-otp",
            mobile
        });
        return res.json({
            message: authMessages.SendOTPSuccessfully
        });
    } catch (error) {
        next(error);
    }
}

async function checkOTP(req, res, next) {
    try {
        const { mobile, code } = req.body;
        const token = await authService.checkOTP(mobile, code);

        res.cookie(cookieNames.AccessToken, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === NodeEnv.Production
        });
        res.redirect("/"); // will be changed!
        return res.json({
            message: authMessages.LoginSuccessfully
        });
    } catch (error) {
        next(error);
    }
}

async function logOut(req, res, next) {
    try {
        res.redirect("/"); // will be changed!
        return res.clearCookie(cookieNames.AccessToken).status(200).json({
            message: authMessages.LogoutSuccessfully
        });
    } catch (error) {
        next(error);
    }
}

function logIn(req, res, next) {
    try {
        return res.render("auth.main.ejs", {
            operation: "send-otp"
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendOTP,
    checkOTP,
    logOut,
    logIn
}