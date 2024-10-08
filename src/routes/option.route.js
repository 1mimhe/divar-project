const { Router } = require('express');
const optionRouter = Router();
const optionController = require("../controllers/option.controller");

optionRouter.post("/", optionController.createOption);
optionRouter.get("/by-category/:categoryId", optionController.findCategoryOptions);
optionRouter.get("/by-category-slug/:slug", optionController.findOptionByCategorySlug);
optionRouter.get("/:id", optionController.findOptionById);
optionRouter.get("/", optionController.findAllOptions);
optionRouter.put("/:id", optionController.updateOption);
optionRouter.delete("/:id", optionController.removeOption);

module.exports = optionRouter;