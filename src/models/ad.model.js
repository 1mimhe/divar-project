const mongoose = require("mongoose");

// Advertisement (Ad) attributes: adSchema + the category's options.
const adSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], required: false, default: [] },
    province: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: false },
    address: { type: String, required: false },
    showNumber: { type: Boolean, required: false, default: false },
    isActiveChat: { type: Boolean, required: false, default: false },
    options: { type: Object, required: false, default: {} },
    publishedBy: { type: Object, required: true }
}, {
    timestamps: true
});

const AdModel = mongoose.model("Ad", adSchema);
module.exports = AdModel;