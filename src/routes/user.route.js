const { Router } = require('express');
const userRouter = Router();
const UserController = require("../controllers/user.controller");
const { authorization } = require("../middlewares/auth.middleware");

userRouter.get("/", UserController.getAllUsers);
userRouter.get("/me", authorization, UserController.whoAmI);
userRouter.get("/:userId", UserController.getUserById);
userRouter.get("/by-mobile/:mobile", UserController.getUserByMobile);

module.exports = userRouter;