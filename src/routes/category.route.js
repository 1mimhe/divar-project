const { Router } = require('express');
const categoryRouter = Router();
const categoryController = require("../controllers/category.controller");
const authorization = require("../middlewares/auth.middleware");

categoryRouter.post("/", authorization, categoryController.createCategory);
categoryRouter.get("/", categoryController.findAllCategories);
categoryRouter.delete("/:id", authorization, categoryController.removeCategory);

module.exports = categoryRouter;