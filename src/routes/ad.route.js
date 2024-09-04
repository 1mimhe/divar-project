const { Router } = require('express');
const adRouter = Router();
const { upload } = require("../middlewares/multer.middleware");
const adController = require("../controllers/ad.controller");

adRouter.get("/create", adController.createAdForm);
adRouter.post("/create", upload.any(), adController.createAd);

module.exports = adRouter;