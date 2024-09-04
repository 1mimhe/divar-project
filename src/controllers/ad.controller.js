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
        const { lat, lng, title, description, category, phoneNumber, price, showNumber, isActiveChat } = req.body;
        const options = req.body;
        await AdService.createAd({
            address: { coordinate: [lat, lng] },
            title, description,
            category: new Types.ObjectId(category),
            phoneNumber, price, showNumber, isActiveChat, options
        });

        return res.status(201).json({
            message: AdMessages.AdCreated
        })
    } catch (err) {
        next(err);         
    }
}

module.exports = {
    createAdForm,
    createAd
}