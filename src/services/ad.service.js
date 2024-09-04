const Ad = require("../models/ad.model");

async function createAd(adDTO) {
    return Ad.create(adDTO);
}

module.exports = {
    createAd
}