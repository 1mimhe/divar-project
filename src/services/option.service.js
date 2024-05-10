const createHttpError = require('http-errors');
const slugify = require('slugify');
const Option = require("../models/option.model");
const OptionMessages = require("../constants/option.messages");
const CategoryService = require("../services/category.service");

async function createOption(option) {
    const category = await CategoryService.checkExistsById(option.category);
    option.category = category._id;

    option.key = slugify(option.key, {lower: true, replacement: "_"});
    await checkExistsByKeyAndCategory(option.key, option.category);

    if (option?.enum && typeof option.enum === "string") {
        option.enum = option.enum.split(",");
    }

    const newOption = await Option.create(option);
    return newOption;
}

async function checkExistsByKeyAndCategory(key, category) {
    const findOpt = await Option.findOne({key, category});
    if (findOpt) throw new createHttpError.Conflict(OptionMessages.AlreadyExists);
    return false;
}

async function findOptionById(id) {
    const option = await Option.findById(id).populate([{path: "category", select: {name: 1, slug: 1}}])
    if (!option) throw new createHttpError.NotFound(OptionMessages.NotFound);
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
    if (!option) throw new createHttpError.NotFound(OptionMessages.NotFound);
    return option;
}

async function findAllOptions() {
    const options = await Option.find({});
    if (!options.length) throw new createHttpError.NotFound(OptionMessages.NotFoundAny);
    return options;
}

module.exports = {
    createOption,
    checkExistsByKeyAndCategory,
    findOptionByCategorySlug,
    findOptionById,
    findAllOptions
}