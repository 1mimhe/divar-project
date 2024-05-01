const mongoose = require("mongoose");

const adsSchema = new mongoose.Schema({
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
});

const Ads = mongoose.model("Ads", adsSchema);
module.exports = Ads;