const { Router } = require('express');
const userRouter = Router();
const userController = require("../controllers/user.controller");
const authorization = require("../middlewares/auth.middleware");

userRouter.get("/me", authorization, userController.whoAmI);

module.exports = userRouter;