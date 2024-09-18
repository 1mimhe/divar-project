const mongoose = require('mongoose');
const createError = require('http-errors');
const authMessages = require("../constants/auth.messages");

const OTPSchema = new mongoose.Schema({
    code: {
        type: String,
        required: false,
        default: undefined
    },
    expiresIn: {
        type: Number, // milliseconds
        required: false,
        default: 0
    }
});

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: false
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: OTPSchema,
        required: false
    },
    verifiedMobile: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});

userSchema.statics.findByMobile = async function (mobile) {
    const user = await this.findOne({ mobile });
    if (!user) throw new createError.NotFound(authMessages.UserNotFound);
    return user;
}

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;