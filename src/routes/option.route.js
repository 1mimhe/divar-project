const {Router} = require('express');
const optionRouter = Router();
const optionController = require("../controllers/option.controller");
const authorization = require("../middlewares/auth.middleware");

optionRouter.post("/", authorization, optionController.createOption);
optionRouter.get("/", authorization, optionController.findOptions);

module.exports = optionRouter;