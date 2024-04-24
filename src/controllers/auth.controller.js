const authService = require("../services/auth.service");
const authMessages = require("../constants/auth.messages");
const NodeEnv = require("../constants/env.enum");

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

        res.cookie('access_token', token, {
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

module.exports = {
    sendOTP,
    checkOTP
}