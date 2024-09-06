const { Router } = require('express');
const adRouter = Router();
const { upload } = require("../middlewares/multer.middleware");
const adController = require("../controllers/ad.controller");
const authorization = require("../middlewares/auth.middleware");

adRouter.get("/create", authorization, adController.createAdForm);
adRouter.post("/create", authorization, upload.any(), adController.createAd);

module.exports = adRouter;