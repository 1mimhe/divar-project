const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const Category = require("../models/category.model");
const Option = require("../models/option.model");
const CategoryMessages = require("../constants/category.messages");
const slugify = require("slugify");
const translatte = require('translatte');

async function createCategory(category) {
    if (category?.slug) {
        category.slug = (await translatte(category.slug)).text;
    } else {
        category.slug = (await translatte(category.name)).text;
    }
    category.slug = slugify(category.slug, {
        lower: true
    });
    await checkSlugExists(category.slug);

    if (category?.parent && mongoose.isValidObjectId(category.parent)) {
        const parentCategory = await checkExistsById(category.parent);
        category.parent = parentCategory._id;
        category.parents = [
            ...new Set([
                parentCategory._id.toString(),
                ...parentCategory.parents.map(_id => _id.toString())
            ])
        ].map(_id => new mongoose.Types.ObjectId(_id));
    } else delete category.parent;

    const newCategory = await Category.create(category);
    return newCategory;
}

async function findAllCategories() {
    const categories = await Category.find({ parent: { $exists: false } });
    return categories;
}

async function removeCategory(_id) {
    const deletedCategory = await Category.findOneAndDelete({ _id });
    const deletedOptions = await Option.deleteMany({ category: deletedCategory._id });
    return {
        deletedCategory,
        deletedOptions
    };
}

async function checkExistsById(_id) {
    const category = await Category.findById(_id);
    if (!category) throw new createHttpError.NotFound(CategoryMessages.CategoryNotFound);
    return category;
}

async function checkSlugExists(slug) {
    const category = await Category.findBySlug(slug);
    if (category) throw new createHttpError.Conflict(CategoryMessages.SlugExists);
    return category;
}

module.exports = {
    createCategory,
    findAllCategories,
    removeCategory,
    checkExistsById,
    checkSlugExists
}