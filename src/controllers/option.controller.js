const OptionService = require("../services/option.service");
const OptionMessages = require("../constants/option.messages");
const Option = require("../models/option.model");

async function createOption(req, res, next) {
    try {
        const {title, key, type, enum: list, guide, category} = req.body;
        await OptionService.createOption({title, key, type, enum: list, guide, category});
        return res.status(201).json({
            message: OptionMessages.Created
        });
    } catch (err) {
        next(err);
    }
}

async function findOptions(req, res, next) {
    try {
        const categoryId = req.params.categoryId;
        const categoryOptions = await Option.findOptions(categoryId);
        return res.json(categoryOptions);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createOption,
    findOptions
}