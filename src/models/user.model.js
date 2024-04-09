const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: false,
        default:  undefined
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

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;