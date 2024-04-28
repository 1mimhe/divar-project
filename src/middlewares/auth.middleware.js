const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const authMessages = require("../constants/auth.messages");
const User = require("../models/user.model");

async function authorization(req, res, next) {
    try {
        const token = req.cookies?.access_token;
        if (!token) throw new createError.Unauthorized(authMessages.Unauthorized);

        const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        if (payload?.id) {
            const user = await User.findById(payload.id, { _id: 1, mobile: 1, createdAt: 1 });
            if (!user) throw new createError.Unauthorized(authMessages.UserNotFound);
            req.user = user;
            return next();
        }
        throw new createError.Unauthorized(authMessages.InvalidToken);
    } catch (err) {
        next(err);
    }
}

module.exports = authorization;