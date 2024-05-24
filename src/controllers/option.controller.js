const OptionService = require("../services/option.service");
const OptionMessages = require("../constants/option.messages");
const Option = require("../models/option.model");

async function createOption(req, res, next) {
    try {
        const {title, key, type, enum: list, guide, category, required} = req.body;
        await OptionService.createOption({title, key, type, enum: list, guide, category, required});
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

async function findOptionById(req, res, next) {
    try {
        const option = await OptionService.findOptionById(req.params.id);
        return res.json(option);
    } catch (err) {
        next(err);
    }
}

async function findOptionByCategorySlug(req, res, next) {
    try {
        const options = await OptionService.findOptionByCategorySlug(req.params.slug);
        return res.json(options);
    } catch (err) {
        next(err);
    }
}

async function findAllOptions(req, res, next) {
    try {
        const options = await OptionService.findAllOptions();
        return res.json(options);
    } catch (err) {
        next(err);
    }
}

async function updateOption(req, res, next) {
    try {
        const {id} = req.params;
        const {title, key, type, enum: list, guide, category, required} = req.body;
        const updatedOption = await OptionService.updateOption(id, {title, key, type, enum: list, guide, category, required});
        return res.json({
            message: OptionMessages.Update,
            updatedOption
        });
    } catch (err) {
        next(err);
    }
}

async function removeOption(req, res, next) {
    try {
        const {id} = req.params;
        const deletedOption = await OptionService.removeById(id);
        return res.json({
            message: OptionMessages.Deleted,
            deletedOption
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createOption,
    findOptions,
    findOptionByCategorySlug,
    findOptionById,
    findAllOptions,
    updateOption,
    removeOption
}