const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "avatars", // Tạo thư mục "avatars" trên Cloudinary
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

const upload = multer({ storage });

module.exports = upload;
