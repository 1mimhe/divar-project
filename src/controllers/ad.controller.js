const CategoryService = require("../services/category.service");
const Option = require("../models/option.model.js");
const AdMessages = require("../constants/ad.messages.js");
const AdService = require("../services/ad.service.js");
const { Types } = require("mongoose");

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

        res.render('panel.main.ejs', {
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
        const ads = await AdService.getMyAds(req.user._id);

        return res.render("panel.main.ejs", {
            operation: "show-ads",
            message: AdMessages.AdCreated,
            ads,
            count: 2
        });
    } catch (err) {
        next(err);         
    }
}

async function getMyAds(req, res, next) {
    try {
        const ads = await AdService.getMyAds(req.user._id);
        
        return res.render("panel.main.ejs", {
            operation: "show-ads",
            message: null,
            ads,
            count: 2
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAdForm,
    createAd,
    getMyAds
}