const authService = require("../services/auth.service");
const authMessages = require("../constants/auth.messages");

async function sendOTP(req, res, next) {
    try {
        const {mobile} = req.body;
        const result = await authService.sendOTP(mobile);
        return {
            message: authMessages
        }
    } catch (error) {
        next(error);
    }
}

async function checkOTP(req, res, next) {
    try {

    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendOTP,
    checkOTP
}