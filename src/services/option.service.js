const createHttpError = require('http-errors');
const Option = require("../models/option.model");
const OptionMessages = require("../constants/option.messages");
const CategoryService = require("../services/category.service");

async function createOption(option) {
    await CategoryService.checkExistsById(option.category);
    const findOpt = await Option.findOne({title: option.key, category: option.category});
    if (findOpt) throw new createHttpError.Conflict(OptionMessages.AlreadyExists);

    const newOption = await Option.create(option);
    return newOption;
}

module.exports = {
    createOption
}