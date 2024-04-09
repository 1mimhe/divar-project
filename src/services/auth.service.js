const {randomInt} = require('crypto');
const createError = require('http-errors');
const User = require("../models/user.model");
const authMessages = require("../constants/auth.messages");

async function sendOTP(mobile) {
    const user = await User.find({mobile});
    const now = new Date().getTime();
    const otp = {
        code: randomInt(10000, 99999),
        expiresIn: now + (2 * 60 * 1000)
    };

    if (!user) {
        const newUser = await User.create({mobile, otp});
        return newUser;
    }

    if (user.otp && user.otp.expiresIn > now) {
        throw new createError.BadRequest(authMessages.OTPNotExpired);
    }

    user.otp = otp;
    await user.save();
    return user;
}

async function checkOTP(mobile, code) {

}

module.exports = {
    sendOTP,
    checkOTP
}