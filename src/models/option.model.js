const mongoose = require('mongoose');
const createHttpError = require('http-errors');
const OptionMessages = require("../constants/option.messages");

const optionSchema = new mongoose.Schema({
    title: {type: String, required: true},
    key: {type: String, required: true},
    type: {type: String, enum: ["number", "string", "boolean"], required: true},
    category: {type: mongoose.Types.ObjectId, ref: "Category", required: true},
    enum: {type: Array, default: []},
    guide: {type: String, required: false}
});

optionSchema.statics.findOptions = async function(categoryId) {
    const options = await this.find({category: categoryId});
    if (!options.length) throw new createHttpError.NotFound(OptionMessages.NoOptions);
    return options;
}

const OptionModel = mongoose.model("Option", optionSchema);
module.exports = OptionModel;