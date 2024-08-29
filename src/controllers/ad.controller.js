const CategoryService = require("../services/category.service");
const Option = require("../models/option.model.js");

async function createAdForm(req, res, next) {
    try {
        let { slug } = req.query;
        let categories;
        let options;
        if (slug && slug !== "root") {
            slug = slug.trim();
            const category = await CategoryService.findCategoryBySlug(slug);
            categories = category.children;
            options = await Option.findCategoryOptions(category._id);
        } else {
            categories = await CategoryService.findAllCategories();
        }

        res.render('panel.main.ejs', {
           operation: "create-ad",
           slug,
           categories,
           options
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createAdForm
}