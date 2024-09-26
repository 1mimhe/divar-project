const { Router } = require('express');
const adRouter = Router();
const { upload } = require("../utils/multer.util");
const adController = require("../controllers/ad.controller");
const authorization = require("../middlewares/auth.middleware");

adRouter.get("/create", authorization, adController.createAdForm);
adRouter.post("/create", authorization, upload.array("images", 10), adController.createAd);
adRouter.get("/", adController.getAllAds);
adRouter.get("/my", authorization, adController.getMyAds);
adRouter.get("/bookmark", authorization, adController.getAllUserBookmarks);
adRouter.get("/note", authorization, adController.getAllUserNotes);
adRouter.get("/:adId", adController.getAdById);
adRouter.delete("/:adId", authorization, adController.deleteAdById);
adRouter.post("/bookmark/:adId", authorization, adController.bookmarkAd);
adRouter.post("/unbookmark/:adId", authorization, adController.unBookmarkAd);
adRouter.post("/note/:adId", authorization, adController.addNote);
adRouter.delete("/note/:adId", authorization, adController.deleteNote);

module.exports = adRouter;