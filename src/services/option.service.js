const createHttpError = require('http-errors');
const slugify = require('slugify');
const Option = require("../models/option.model");
const OptionMessages = require("../constants/option.messages");
const CategoryService = require("../services/category.service");
const { isValidObjectId } = require("mongoose");

async function createOption(option) {
    const category = await CategoryService.checkExistsById(option.category);
    if (!category.children?.length) throw new createHttpError.BadRequest(OptionMessages.CantCreateOption);

    option.category = category._id;
    option.key = slugify(option.key, { lower: true, replacement: "_" });
    await checkExistsByKeyAndCategory(option.key, option.category);

    if (option?.type === "array" && option?.enum && typeof option.enum === "string") {
        option.enum = option.enum.split(",");
    }

    option.required = option?.required === "true" || option?.required === true;

    return Option.create(option);
}

async function findCategoryOptions(categoryId) {
    const options = await Option.findCategoryOptions(categoryId);
    if (!options.length) throw new createHttpError.NotFound(OptionMessages.NoOptionsFound);
    return options;
}

async function checkExistsByKeyAndCategory(key, category) {
    const findOpt = await Option.findOne({ key, category });
    if (findOpt) throw new createHttpError.Conflict(OptionMessages.OptionAlreadyExists);
    return false;
}

async function findOptionById(id) {
    const option = await Option.findById(id).populate([{ path: "category", select: { name: 1, slug: 1 } }])
    if (!option) throw new createHttpError.NotFound(OptionMessages.OptionNotFound);
    return option;
}

async function findOptionByCategorySlug(slug) {
    const [option] = await Option.aggregate([
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"
        },
        {
            $project: {
                "category.parent": 0,
                "category.parents": 0,
                "category.children": 0,
                "category.icon": 0,
                __v: 0
            }
        },
        {
            $match: {
                "category.slug": slug
            }
        }
    ]);
    if (!option) throw new createHttpError.NotFound(OptionMessages.OptionNotFound);
    return option;
}

async function findAllOptions() {
    const options = await Option.find({});
    if (!options.length) throw new createHttpError.NotFound(OptionMessages.NoOptions);
    return options;
}

async function updateOption(id, option) {
    const theOption = await Option.findById(id);

    if (option?.category && isValidObjectId(option.category)) {
        const category = await CategoryService.checkExistsById(option.category);
        option.category = category._id;
    } else {
        delete option.category;
    }

    if (option?.key) {
        option.key = slugify(option.key, { lower: true, replacement: "_" });
        const categoryId = option.category || theOption.category;
        await checkExistsByKeyAndCategory(option.key, categoryId);
    }

    if (option?.enum && typeof option.enum === "string") {
        option.enum = option.enum.split(",");
    }

    if (option?.required !== undefined)
        option.required = option?.required === "true" || option?.required === true;

    return Option.findOneAndUpdate({ _id: id }, { $set: option });
}

async function removeOption(id) {
    const deletedOption = await Option.findOneAndDelete(id);
    if (!deletedOption) throw new createHttpError.NotFound(OptionMessages.OptionNotFound);
    return deletedOption;
}

module.exports = {
    createOption,
    findCategoryOptions,
    checkExistsByKeyAndCategory,
    findOptionByCategorySlug,
    findOptionById,
    findAllOptions,
    updateOption,
    removeOption
}