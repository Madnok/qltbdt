const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require('path'); // <-- Thêm import path
const fs = require('fs');     // <-- Thêm import fs

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

// --- Cấu hình diskStorage cho chứng từ ---
const chungTuTempPath = path.join(__dirname, '../uploads/chungtu_temp'); // Tạo thư mục tạm

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(chungTuTempPath)) {
    fs.mkdirSync(chungTuTempPath, { recursive: true });
    console.log(`Created temporary upload directory: ${chungTuTempPath}`);
}

const storageDocsDisk = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, chungTuTempPath); // Lưu vào thư mục tạm
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
// --- Kết thúc cấu hình diskStorage ---

const fileFilterDocs = (req, file, cb) => {
    // Giữ nguyên file filter
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Loại file không hợp lệ! Chỉ chấp nhận ảnh (JPEG, PNG,...) hoặc PDF.'), false);
    }
};

// Sử dụng diskStorage cho docUpload
const docUpload = multer({
    storage: storageDocsDisk, // <-- THAY ĐỔI Ở ĐÂY
    fileFilter: fileFilterDocs,
    limits: { fileSize: 1024 * 1024 * 10 } // Giữ nguyên giới hạn
});

const uploadInvoiceImage = multer({ storage: invoiceImageStorage });
const uploadReportImage = multer({ storage: reportImageStorage });
const upload = multer({ storage });

module.exports = { upload, uploadReportImage, uploadInvoiceImage, docUpload };
