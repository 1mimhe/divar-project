const createHttpError = require("http-errors");
const utf8 = require("utf8");
const Ad = require("../models/ad.model");
const Option = require("../models/option.model");
const AdMessages = require("../constants/ad.messages");
const CategoryService = require("../services/category.service");

async function createAd(adDTO) {
    await CategoryService.checkExistsById(adDTO.category);
    
    if (adDTO?.images) {
        adDTO.images = adDTO.images.map(image => image.path?.replace("public", ""));
    } else delete adDTO.images;

    if (!adDTO?.district) delete adDTO.district;
    if (!adDTO?.address) delete adDTO.address;

    adDTO.phoneNumber = adDTO.publishedBy.mobile;

    adDTO.showNumber = adDTO?.showNumber === "true" || adDTO?.showNumber === true;
    adDTO.isActiveChat = adDTO?.isActiveChat === "true" || adDTO?.isActiveChat === true;

    const result = await Ad.create(adDTO);
    return result;
}

async function getOptionsFromBody(body, categoryId) {
    const commonOptions = ["title", "description", "category", "images", "province", "city", "district", "address",
            "phoneNumber", "showNumber", "isActiveChat"];
    commonOptions.forEach(value => delete body[value]);

    const categoryOptions = await Option.findCategoryOptions(categoryId);
    if (!categoryOptions.length) return;

    for (let key in body) {
        const decodedKey = utf8.decode(key);
        body[decodedKey] = body[key];
        delete body[key];
    }

    const options = [];
    categoryOptions.forEach((option) => {
        if (option.required && !body[option.title]) throw new createHttpError.BadRequest(AdMessages.AdNotCreated);
        if (body[option.title]) options.push(body[option.title]);
    });
    return options;
}

module.exports = {
    createAd,
    getOptionsFromBody
}