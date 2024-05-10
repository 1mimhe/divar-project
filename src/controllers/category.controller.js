const CategoryService = require("../services/category.service");
const CategoryMessages = require("../constants/category.messages");

async function createCategory(req, res, next) {
    try {
        const { name, slug, icon, parent } = req.body;
        await CategoryService.createCategory({ name, slug, icon, parent });
        return res.status(201).json({
            message: CategoryMessages.CategoryCreated
        });
    } catch (err) {
        next(err);
    }
}

async function findAllCategories(req, res, next) {
    try {
        const categories = await CategoryService.findAllCategories();
        return res.status(201).json(categories);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createCategory,
    findAllCategories
}