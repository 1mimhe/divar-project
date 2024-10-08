const CategoryService = require("../services/category.service");
const Option = require("../models/option.model.js");
const AdMessages = require("../constants/ad.messages.js");
const AdService = require("../services/ad.service.js");
const { Types } = require("mongoose");
let message = null;

async function createAdForm(req, res, next) {
    try {
        let { slug } = req.query;
        let category;
        let categories;
        let options;

        if (slug && slug !== "root") {
            slug = slug.trim();
            category = await CategoryService.findCategoryBySlug(slug);
            categories = category.children;
            options = await Option.findCategoryOptions(category._id);
        } else {
            categories = await CategoryService.findAllCategories();
        }

        return res.render('panel.main.ejs', {
            operation: "create-ad",
            user: req.user,
            category,
            categories,
            options
        });
    } catch (error) {
        next(error);
    }
}

async function createAd(req, res, next) {
    try {        
        const { title, description, province, city, district, address,
            price, showNumber, isActiveChat } = req.body;
        const images = req.files;

        const category = new Types.ObjectId(req.body.category);
        const options = AdService.getOptionsFromBody(req.body.options ?? req.body, category);
        const publishedBy = req.user;

        await AdService.createAd({
            title, description, category, images, province, city, district, address,
            price, showNumber, isActiveChat, options, publishedBy
        });

        if (req.query.render === "true") {
            message = AdMessages.AdCreated;
            return res.redirect("/ad/my?render=true");
        }

        return res.status(201).json({
            message: AdMessages.AdCreated
        });
    } catch (error) {
        next(error);
    }
}

async function getAllAds(req, res, next) {
    try {
        const { search, city } = req.query;
        let { category } = req.query;
        if (category) category = await CategoryService.findCategoryBySlug(category);
        const ads = await AdService.getAllAds(search, category?._id, city);

        if (req.query.render === "true") {
            return res.render('website.main.ejs', {
                operation: "home",
                ads,
                search,
                category,
                city
            });
        }

        return res.json(ads);
    } catch (error) {
        next(error);
    }
}

async function getMyAds(req, res, next) {
    try {
        const ads = await AdService.getMyAds(req.user._id);

        if (req.query.render === "true") {
            res.render("panel.main.ejs", {
                operation: "show-ads",
                user: req.user,
                message,
                ads
            });
            message = null;
            return;
        }

        return res.json(ads);
    } catch (error) {
        next(error);
    }
}

async function getAdById(req, res, next) {
    try {
        const { adId } = req.params;
        const ad = await AdService.getAdById(adId);
        
        if (req.query.render === "true") {
            const userId = req.user?._id;
            const note = userId ? await AdService.getNoteByAdId(adId, userId) : undefined;
            return res.render("website.main.ejs", {
                operation: "show-ad",
                ad,
                category: ad.category,
                note: note.content,
                city: ad.city,
                search: undefined
            });
        }

        return res.json(ad);
    } catch (error) {
        next(error);
    }
}

async function deleteAdById(req, res, next) {
    try {
        const { adId } = req.params;
        await AdService.deleteAdById(adId);

        if (req.query.render === "true") {
            message = AdMessages.AdDeleted;
            return res.redirect("/ad/my?render=true");
        }

        return res.json({
            message: AdMessages.AdDeleted
        });
    } catch (error) {
        next(error);
    }
}

async function bookmarkAd(req, res, next) {
    try {
        const { adId } = req.params;
        const userId = req.user._id;
        await AdService.bookmarkAd(adId, userId);

        return res.json({
            message: AdMessages.AdBookmarked
        });
    } catch (error) {
        next(error);        
    }
}

async function unBookmarkAd(req, res, next) {
    try {
        const { adId } = req.params;
        const userId = req.user._id;
        await AdService.unBookmarkAd(adId, userId);

        if (req.query.render === "true") {
            message = AdMessages.AdUnBookmarked;
            return res.redirect("/ad/bookmark/?render=true");
        }

        return res.json({
            message: AdMessages.AdUnBookmarked
        });
    } catch (error) {
        next(error);        
    }
}

async function getAllUserBookmarks(req, res, next) {
    try {
        const userId = req.user._id;
        const bookmarks = await AdService.getAllUserBookmarks(userId);

        if (req.query.render === "true") {
            return res.render("panel.main.ejs", {
                operation: "bookmarks",
                user: req.user,
                bookmarks
            });
        }

        return res.json({
            bookmarks
        });
    } catch (error) {
        next(error);        
    }
}

async function addNote(req, res, next) {
    try {
        const { adId } = req.params;
        const { note } = req.body;
        const userId = req.user._id;
        await AdService.addNote(adId, userId, note);

        if (req.query.render === "true") {    
            message = AdMessages.AdNoteAdded;
            return res.redirect(`/ad/${adId}?render=true`);
        }

        return res.json({
            message: AdMessages.AdNoteAdded
        });
    } catch (error) {
        next(error);        
    }
}

async function deleteNote(req, res, next) {
    try {
        const { adId } = req.params;
        const userId = req.user._id;
        await AdService.deleteNote(adId, userId);

        if (req.query.render === "true") {
            message = AdMessages.AdNoteDeleted;
            return res.redirect("/ad/note/?render=true");
        }

        return res.json({
            message: AdMessages.AdNoteDeleted
        });
    } catch (error) {
        next(error);        
    }
}

async function getAllUserNotes(req, res, next) {
    try {
        const userId = req.user._id;
        const notes = await AdService.getAllUserNotes(userId);

        if (req.query.render === "true") {
            return res.render("panel.main.ejs", {
                operation: "notes",
                user: req.user,
                notes
            });
        }

        return res.json({
            notes
        });
    } catch (error) {
        next(error);        
    }
}

async function getNoteByAdId(req, res, next) {
    try {
        const { adId } = req.params;
        const userId = req.user._id;
        const note = await AdService.getNoteByAdId(adId, userId);

        return res.json({
            note
        });
    } catch (error) {
        next(error);        
    }
}

module.exports = {
    createAdForm,
    createAd,
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