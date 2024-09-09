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
           category,
           categories,
           options
        });
    } catch (err) {
        next(err);
    }
}

async function createAd(req, res, next) {
    try {
        const { title, description, province, city, district, address,
            phoneNumber, showNumber, isActiveChat } = req.body;
        const images = req.files;
        
        const category = new Types.ObjectId(req.body.category);
        const options = AdService.getOptionsFromBody(req.body, category);
        const publishedBy = req.user;

        await AdService.createAd({
            title, description, category, images, province, city, district, address,
            phoneNumber, showNumber, isActiveChat, options, publishedBy
        });

        message = AdMessages.AdCreated;
        return res.redirect("/ad/my");
    } catch (err) {
        next(err);         
    }
}

async function getAllAds(req, res, next) {
    try {
        const ads = await AdService.getAllAds({}, { sort: { _id: -1 } });
        
        return res.render('website.main.ejs', {
            operation: "home",
            ads
        });
    } catch (error) {
        next(error);
    }
}

async function getMyAds(req, res, next) {
    try {
        const ads = await AdService.getMyAds(req.user._id);
        
        res.render("panel.main.ejs", {
            operation: "show-ads",
            message,
            ads
        });
        message = null;
    } catch (error) {
        next(error);
    }
}

async function getAdById(req, res, next) {
    try {
        const { adId } = req.params;
        const ad = await AdService.getAdById(adId);
        
        return res.render("website.main.ejs", {
            operation: "show-ad",
            ad
        });
    } catch (error) {
        next(error);
    }
}

async function deleteAdById(req, res, next) {
    try {
        const { adId } = req.params;
        await AdService.deleteAdById(adId);
        
        message = AdMessages.AdDeleted;
        return res.redirect("/ad/my");
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
    deleteAdById
}