const express = require("express");
const router = express.Router();
const baotriController = require("../controllers/baotriController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { uploadInvoiceImage } = require("../middleware/upload"); // Giả sử bạn đã tạo middleware này

router.use(verifyToken); // Tất cả các route dưới đây yêu cầu đăng nhập

// Lấy danh sách task đang tiến hành/yêu cầu làm lại của nhân viên
router.get("/my-tasks", requireRole(['nhanvien']), baotriController.getMyTasks);

// Tạo log bảo trì mới
router.post("/", requireRole(['nhanvien']), baotriController.createLogBaoTri);

// Upload ảnh hóa đơn (nếu có)
router.post("/upload-invoice", requireRole(['nhanvien']), uploadInvoiceImage.array('hinhAnhHoaDon', 5), baotriController.uploadInvoiceImage); // Cho phép upload tối đa 5 ảnh

// // Lấy lịch sử log của một báo hỏng
// router.get("/log/:baohong_id", requireRole(['admin', 'nhanvien']), baotriController.getBaoHongLog);

// // Lấy log theo thongtinthietbi_id 
// router.get('/thietbi/:thongtinthietbi_id', requireRole(['admin', 'nhanvien']), baotriController.getLogsByThietBiId);

// // THÊM ROUTE MỚI: Lấy log theo ID lịch bảo dưỡng
// router.get('/log/:lichbaoduong_id', verifyToken, requireRole(['admin', 'nhanvien']), baotriController.getLogsByLichBaoDuongId);

// === LẤY LOG ===
router.get("/logs", requireRole(['admin', 'nhanvien']), baotriController.getLogs);


module.exports = router;