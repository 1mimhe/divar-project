const createHttpError = require('http-errors');
const Option = require("../models/option.model");
const OptionMessages = require("../constants/option.messages");

async function createOption(option) {
    const findOpt = await Option.findOne({title: option.title, category: option.category});
    if (findOpt) throw new createHttpError.BadRequest(OptionMessages.AlreadyExists);

    const newOption = await Option.create(option);
    return newOption;
}

module.exports = {
    createOption
}