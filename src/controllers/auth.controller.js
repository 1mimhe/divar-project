const authService = require("../services/auth.service");
const authMessages = require("../constants/auth.messages");
const NodeEnv = require("../constants/env.enum");
const cookieNames = require("../constants/cookie.enum");

async function sendOTP(req, res, next) {
    try {
        const {mobile} = req.body;
        await authService.sendOTP(mobile);
        return res.json({
            message: authMessages.SendOTPSuccessfully
        });
    } catch (error) {
        next(error);
    }
}

async function checkOTP(req, res, next) {
    try {
        const {mobile, code} = req.body;
        const token = await authService.checkOTP(mobile, code);

        res.cookie(cookieNames.AccessToken, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === NodeEnv.Production
        });
        return res.json({
            message: authMessages.LoginSuccessfully
        });
    } catch (error) {
        next(error);
    }
}

async function logOut(req, res, next) {
    try {
        return res.clearCookie(cookieNames.AccessToken).status(200).json({
            message: authMessages.LogoutSuccessfully
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    sendOTP,
    checkOTP,
    logOut
}