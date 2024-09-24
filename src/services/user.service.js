const createHttpError = require("http-errors");
const User = require("../models/user.model");
const UserMessages = require("../constants/user.messages");

async function getAllUsers() {
    return User.find({});
}

async function getUserById(_id) {
    const user = await User.findOne({ _id });
    if (!user) throw new createHttpError.NotFound(UserMessages.UserNotFound);
    return user;
}

async function getUserByMobile(mobile) {
    const user = await User.findByMobile(mobile);
    if (!user) throw new createHttpError.NotFound(UserMessages.UserNotFound);
    return user;
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByMobile
}