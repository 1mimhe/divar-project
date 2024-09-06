const multer = require("multer");
const fs = require("fs");
const path = require("path");
const createHttpError = require("http-errors");
const AdMessages = require("../constants/ad.messages");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        fs.mkdirSync(path.join(process.cwd(), "public", "uploads"), { recursive: true });
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        const fileExt = path.extname(file.originalname);
        const whiteListFormat = [".png", ".jpg", ".jpeg", ".webp"];

        if (whiteListFormat.includes(fileExt)) {
            const filename = new Date().getTime().toString() + fileExt;
            cb(null, filename);
        } else {
            cb(new createHttpError.BadRequest(AdMessages.UnsupportedFileFormat));
        }

    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 3 * 1000 * 1000 // 3 MB
    }
});

module.exports = {
    upload
}