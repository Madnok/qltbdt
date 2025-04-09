const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "avatars", // Tạo thư mục "avatars" 
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
        allowed_formats: ["jpg", "png", "jpeg", "pdf"], 
    },
});

 // --- Cấu hình CloudinaryStorage cho chứng từ ---
 const chungTuStorageCloudinary = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "nhapxuat_documents", // Thư mục chung cho chứng từ nhập/xuất
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
        //  use_filename: true, // Giữ tên file gốc 
        //  unique_filename: true
    },
});


const fileFilterDocs = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Loại file không hợp lệ! Chỉ chấp nhận ảnh (JPEG, PNG,...) hoặc PDF.'), false);
    }
};


// Sử dụng CloudinaryStorage cho docUpload
const docUpload = multer({
    storage: chungTuStorageCloudinary, // <-- Thay đổi ở ĐÂY
    fileFilter: fileFilterDocs,
    limits: { fileSize: 1024 * 1024 * 10 }
});
// --- Kết thúc cấu hình CloudinaryStorage ---

const uploadInvoiceImage = multer({ storage: invoiceImageStorage });
const uploadReportImage = multer({ storage: reportImageStorage });
const upload = multer({ storage });

module.exports = { upload, uploadReportImage, uploadInvoiceImage, docUpload };
