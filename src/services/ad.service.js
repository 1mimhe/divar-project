const createHttpError = require("http-errors");
const utf8 = require("utf8");
const { isValidObjectId, Types } = require("mongoose");
const Ad = require("../models/ad.model");
const Option = require("../models/option.model");
const Category = require("../models/category.model");
const AdMessages = require("../constants/ad.messages");
const AuthMessages = require("../constants/auth.messages");
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
        "price", "showNumber", "isActiveChat"];
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

async function getAllAds(search, category, city) {
    const filter = {};

    if (search) {
        filter.title = { $regex: new RegExp(`.*${search}.*`) };
    }

    if (city) {
        filter.city = { $regex: new RegExp(`.*${city}.*`) };
    }

    if (category) {
        const categories = (await Category.find({ parents: category }, { _id: 1 })).map(category => category._id);
        filter.category = {
            $in: [category, ...categories]
        };        
    }
    
    return Ad.find(filter, { publishedBy: 0 }, { sort: { _id: -1 } });
}

async function getMyAds(userId) {
    if (!isValidObjectId(userId)) throw new createHttpError.BadRequest(AuthMessages.UserIdIsInvalid);
    return Ad.find({ "publishedBy._id": userId }, {}, { sort: { _id: -1 } });
}

async function getAdById(adId) {
    if (!isValidObjectId(adId)) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
    const ad = await Ad.findOne({ _id: adId });
    if (!ad) throw new createHttpError.NotFound(AdMessages.AdNotFound);
    return ad;
}

async function deleteAdById(adId) {
    if (!isValidObjectId(adId)) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
    const result = await Ad.deleteOne({ _id: adId });
    if (!result) throw new createHttpError.NotFound(AdMessages.AdNotFound);
    return result;
}

module.exports = {
    createAd,
    getOptionsFromBody,
    getAllAds,
    getMyAds,
    getAdById,
    deleteAdById
}