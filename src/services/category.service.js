const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const Category = require("../models/category.model");
const CategoryMessages = require("../constants/category.messages");

async function createCategory(category) {
    if (category) {
        const cat = await Category.findOne({ name: category.name });
        if (cat) throw new Error(CategoryMessages.CategoryExists);
    }

    if (category?.parent && mongoose.isValidObjectId(category.parent)) {
        const parentCategory = await checkExistsById(category.parent);
        category.parent = parentCategory._id;
        category.parents = [
            ...new Set([
                parentCategory._id.toString(),
                ...parentCategory.parents.map(_id => _id.toString())
            ])
        ].map(_id => new mongoose.Types.ObjectId(_id));
    }

    const newCategory = await Category.create(category);
    return newCategory;
}

async function findAllCategories(){
    const categories = await Category.find({});
    return categories;
}

async function checkExistsById(_id) {
    const category = await Category.findById(_id);
    if (!category) throw new createHttpError.NotFound(CategoryMessages.CategoryNotFound);
    return category;
}

module.exports = {
    createCategory,
    findAllCategories
}