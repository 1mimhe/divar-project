const createHttpError = require("http-errors");
const utf8 = require("utf8");
const { isValidObjectId, Types, default: mongoose } = require("mongoose");
const Ad = require("../models/ad.model");
const Option = require("../models/option.model");
const Category = require("../models/category.model");
const User = require("../models/user.model");
const AdMessages = require("../constants/ad.messages");
const AuthMessages = require("../constants/auth.messages");
const CategoryService = require("../services/category.service");
const UserService = require("../services/user.service");

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
    return Ad.find({ "publishedBy._id": userId }, {}, { sort: { _id: -1 } }).populate("category");
}

async function getAdById(adId) {
    if (!isValidObjectId(adId)) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
    const ad = await Ad.findOne({ _id: adId }).populate("category");
    if (!ad) throw new createHttpError.NotFound(AdMessages.AdNotFound);
    return ad;
}

async function deleteAdById(adId) {
    if (!isValidObjectId(adId)) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
    const result = await Ad.deleteOne({ _id: adId });
    if (!result) throw new createHttpError.NotFound(AdMessages.AdNotFound);
    return result;
}

async function bookmarkAd(adId, userId) {
    const user = await UserService.getUserById(userId);

    if (adId && isValidObjectId(adId)) {
        const ad = await getAdById(adId);
        const newBookmark = {
            adId: ad._id,
            adTitle: ad.title
        }
        user.bookmarks.push(newBookmark);
        await user.save();
    } else throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
}

async function unBookmarkAd(adId, userId) {
    const user = await UserService.getUserById(userId);

    if (!user.bookmarks.length) throw new createHttpError.BadRequest(AdMessages.BookmarkNotFound);

    if (adId && isValidObjectId(adId)) {
        const indexToDelete = user.bookmarks.findIndex(bookmark => bookmark.adId == adId);
        if (indexToDelete === -1) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
        user.bookmarks.splice(indexToDelete, 1);
        await user.save();
    } else throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
}

async function getAllUserBookmarks(userId) {
    const user = await UserService.getUserById(userId);
    if (!user.bookmarks.length) throw new createHttpError.BadRequest(AdMessages.BookmarkNotFound);

    return user.bookmarks;
}

async function addNote(adId, userId, content) {
    const user = await UserService.getUserById(userId);

    if (adId && isValidObjectId(adId)) {
        const noteIndex = user.notes.findIndex(note => note.for == adId);
        if (noteIndex === -1) {
            const ad = await getAdById(adId);
            user.notes.push({
                for: ad._id,
                adTitle: ad.title,
                content
            });
        } else {
            user.notes[noteIndex].content = content;
        }
    } else throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);

    await user.save();
}

async function deleteNote(adId, userId) {
    const user = await UserService.getUserById(userId);

    if (!user.notes.length) throw new createHttpError.BadRequest(AdMessages.NoteNotFound);

    if (adId && isValidObjectId(adId)) {
        const noteIndex = user.notes.findIndex(note => note.for == adId);
        if (noteIndex === -1) throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
        user.notes.splice(noteIndex, 1);
        await user.save();
    } else throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
}

async function getAllUserNotes(userId) {
    const user = await UserService.getUserById(userId);
    if (!user.notes.length) throw new createHttpError.BadRequest(AdMessages.NoteNotFound);

    return user.notes;
}

async function getNoteByAdId(adId, userId) {
    const user = await UserService.getUserById(userId);
    if (!user.notes.length) throw new createHttpError.BadRequest(AdMessages.NoteNotFound);
    if (adId && isValidObjectId(adId)) {
        return user.notes.find(note => note.for == adId);
    } else throw new createHttpError.BadRequest(AdMessages.AdIdIsInvalid);
}

module.exports = {
    createAd,
    getOptionsFromBody,
    getAllAds,
    getMyAds,
    getAdById,
    deleteAdById,
    bookmarkAd,
    unBookmarkAd,
    getAllUserBookmarks,
    addNote,
    deleteNote,
    getAllUserNotes,
    getNoteByAdId
}