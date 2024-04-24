const {randomInt} = require('crypto');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const User = require("../models/user.model");
const authMessages = require("../constants/auth.messages");

async function sendOTP(mobile) {
    const user = await User.findOne({mobile});
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
    const user = await User.findByMobile(mobile);
    const now = new Date().getTime();

    if (user.otp?.expiresIn < now) {
        throw new createError.Unauthorized(authMessages.OTPExpired);
    }
    if (user.otp?.code !== code) {
        throw new createError.Unauthorized(authMessages.OTPIsIncorrect);
    }

    if (!user.verifiedMobile) {
        user.verifiedMobile = true;
        await user.save();
    }

    return signJWT({mobile, id: user._id});
}

function signJWT(payload) {
    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: "1w" });
}

module.exports = {
    sendOTP,
    checkOTP,
    signJWT
}