const CategoryService = require("../services/category.service");
const CategoryMessages = require("../constants/category.messages");

async function createCategory(req, res, next) {
    try {
        const { name, slug, icon, parent } = req.body;
        await CategoryService.createCategory({ name, slug, icon, parent });
        return res.status(201).json({
            message: CategoryMessages.CategoryCreated
        });
    } catch (error) {
        next(error);
    }
}

async function findAllCategories(req, res, next) {
    try {
        const categories = await CategoryService.findAllCategories();
        return res.status(201).json(categories);
    } catch (error) {
        next(error);
    }
}

async function removeCategory(req, res, next) {
    try {
        const { id } = req.params;
        const deletedCategory = await CategoryService.removeCategory(id);
        return res.join({
            message: CategoryMessages.CategoryDeleted,
            deletedCategory
        })
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCategory,
    removeCategory,
    findAllCategories
}