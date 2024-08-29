const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ["number", "string", "boolean", "array"], required: true },
    category: { type: mongoose.Types.ObjectId, ref: "Category", required: true },
    required: { type: Boolean, default: false },
    enum: { type: Array, default: [] },
    guide: { type: String, required: false }
});

optionSchema.statics.findCategoryOptions = async function (categoryId) {
    return this.find({ category: categoryId });
}

const OptionModel = mongoose.model("Option", optionSchema);
module.exports = OptionModel;