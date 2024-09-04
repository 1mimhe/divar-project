const mongoose = require("mongoose");

// Advertisement (Ad) attributes: adSchema + the category's options.
const adSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], required: false, default: [] },
    address: {
        required: true,
        province: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        coordinate: { type: [Number], required: true }
    },
    phoneNumber: { type: String, required: false },
    price: { type: number, required: false, default: 0 },
    showNumber: { type: Boolean, required: false, default: false },
    isActiveChat: { type: Boolean, required: false, default: false },
    options: { type: Object, required: false, default: {} }
}, {
    timestamps: true
});

const AdModel = mongoose.model("Ad", adSchema);
module.exports = AdModel;