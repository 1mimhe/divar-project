const mongoose = require("mongoose");

// Advertisement (Ad) attributes: adSchema + the category's options.
const adSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    category: {type: mongoose.Types.ObjectId, ref: "Category", required: true},
    images: {type: [String], required: false, default: []},
    address: {
        required: true,
        province: {type: String, required: true},
        city: {type: String, required: true},
        district: {type: String, required: true},
        coordinate: {type: [Number], required: true}
    }
}, {
    timestamps: true
});

const AdModel = mongoose.model("Ad", adSchema);
module.exports = AdModel;