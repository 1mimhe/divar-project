const { Router } = require('express');
const adRouter = Router();
const { upload } = require("../utils/multer.util");
const adController = require("../controllers/ad.controller");
const authorization = require("../middlewares/auth.middleware");

adRouter.get("/create", authorization, adController.createAdForm);
adRouter.post("/create", authorization, upload.array("images", 10), adController.createAd);

module.exports = adRouter;