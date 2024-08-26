const CategoryService = require("../services/category.service");

async function createAdForm(req, res, next) {
    try {
        let { slug } = req.query;
        let categories = [];
        console.log(slug);
        if (slug) {
            slug = slug.trim();
            categories = (await CategoryService.findCategoryBySlug(slug)).children;
            console.log(categories);
        } else {
            categories = await CategoryService.findAllCategories();
        }

        res.render('panel.main.ejs', {
           operation: "create-post",
           categories,
           slug
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createAdForm
}