const {Router} = require('express');
const optionRouter = Router();
const optionController = require("../controllers/option.controller");
const authorization = require("../middlewares/auth.middleware");

optionRouter.post("/", authorization, optionController.createOption);
optionRouter.get("/by-category/:categoryId", optionController.findOptions);
optionRouter.get("/by-category-slug/:slug", optionController.findOptionByCategorySlug);
optionRouter.get("/:id", optionController.findOptionById);
optionRouter.get("/", optionController.findAllOptions);

module.exports = optionRouter;