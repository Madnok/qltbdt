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

const reportImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "baohong_images", // Thư mục dành cho ảnh báo hỏng
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

const invoiceImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "baotri_invoices", // Thư mục cho ảnh hóa đơn bảo trì
        allowed_formats: ["jpg", "png", "jpeg", "pdf"], // Cho phép cả PDF nếu cần
    },
});

const uploadInvoiceImage = multer({ storage: invoiceImageStorage });
const uploadReportImage = multer({ storage: reportImageStorage });
const upload = multer({ storage });

module.exports = { upload, uploadReportImage, uploadInvoiceImage };
