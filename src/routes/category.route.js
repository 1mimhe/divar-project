const { Router } = require('express');
const categoryRouter = Router();
const categoryController = require("../controllers/category.controller");

categoryRouter.post("/", categoryController.createCategory);
categoryRouter.get("/", categoryController.findAllCategories);
categoryRouter.delete("/:categoryId", categoryController.deleteCategory);

module.exports = categoryRouter;