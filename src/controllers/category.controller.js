const categoryService = require("../services/category.service");
const categoryMessages = require("../constants/category.messages");

async function createCategory(req, res, next) {
    try {
        const { name, slug, icon, parent } = req.body;
        await categoryService.createCategory({ name, slug, icon, parent });
        return res.status(201).json({
            message: categoryMessages.CategoryCreated
        });
    } catch (err) {
        next(err);
    }
}

async function findAllCategories(req, res, next) {
    try {
        const categories = await categoryService.findAllCategories();
        return res.status(201).json(categories);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createCategory,
    findAllCategories
}