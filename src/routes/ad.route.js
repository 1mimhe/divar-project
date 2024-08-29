const { Router } = require('express');
const adRouter = Router();
const adController = require("../controllers/ad.controller");

adRouter.get("/create", adController.createAdForm);

module.exports = adRouter;