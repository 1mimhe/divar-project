const OptionService = require("../services/option.service");
const OptionMessages = require("../constants/option.messages");

async function createOption(req, res, next) {
    try {
        const { title, key, type, enum: list, guide, category, required } = req.body;
        await OptionService.createOption({ title, key, type, enum: list, guide, category, required });
        return res.status(201).json({
            message: OptionMessages.Created
        });
    } catch (error) {
        next(error);
    }
}

async function findCategoryOptions(req, res, next) {
    try {
        const categoryId = req.params.categoryId;
        const categoryOptions = await OptionService.findCategoryOptions(categoryId);
        return res.json(categoryOptions);
    } catch (error) {
        next(error);
    }
}

async function findOptionById(req, res, next) {
    try {
        const option = await OptionService.findOptionById(req.params.id);
        return res.json(option);
    } catch (error) {
        next(error);
    }
}

async function findOptionByCategorySlug(req, res, next) {
    try {
        const options = await OptionService.findOptionByCategorySlug(req.params.slug);
        return res.json(options);
    } catch (error) {
        next(error);
    }
}

async function findAllOptions(req, res, next) {
    try {
        const options = await OptionService.findAllOptions();
        return res.json(options);
    } catch (error) {
        next(error);
    }
}

async function updateOption(req, res, next) {
    try {
        const { id } = req.params;
        const { title, key, type, enum: list, guide, category, required } = req.body;
        const updatedOption = await OptionService.updateOption(id, { title, key, type, enum: list, guide, category, required });
        return res.json({
            message: OptionMessages.OptionUpdated,
            updatedOption
        });
    } catch (error) {
        next(error);
    }
}

async function removeOption(req, res, next) {
    try {
        const { id } = req.params;
        const deletedOption = await OptionService.removeById(id);
        return res.json({
            message: OptionMessages.OptionDeleted,
            deletedOption
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createOption,
    findCategoryOptions,
    findOptionByCategorySlug,
    findOptionById,
    findAllOptions,
    updateOption,
    removeOption
}