const express = require('express');
const lichbaoduongController = require('../controllers/lichbaoduongController');
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Áp dụng middleware xác thực cho tất cả routes
router.use(verifyToken);

// Tạo lịch (Chỉ Admin)
router.post('/', verifyToken, requireRole(['admin']), lichbaoduongController.createLichBaoDuong);

// tạo hàng loạt 
router.post('/bulk', verifyToken, requireRole(['admin']), lichbaoduongController.createBulkLichBaoDuong);


// Gợi ý nhân viên (Chỉ Admin)
router.get('/suggest-staff', verifyToken, requireRole(['admin']), lichbaoduongController.suggestNhanVien);

// Lấy danh sách tb có thể bảo dưỡng k trùng với báo hỏng
router.get('/danhsach-thietbi/:phong_id', verifyToken, requireRole(['admin']), lichbaoduongController.getThietBiTrongPhongToBaoDuong);

// Lấy danh sách (Admin & Nhanvien - Controller xử lý quyền cụ thể)
router.get('/', verifyToken, requireRole(['admin', 'nhanvien']), lichbaoduongController.getLichBaoDuongList);

// Lấy task của nhân viên (Chỉ Nhanvien)
router.get('/my-tasks', verifyToken, requireRole(['nhanvien']), lichbaoduongController.getMyLichBaoDuong);

// Cập nhật trạng thái (Admin & Nhanvien được giao)
router.patch('/:id/status', verifyToken, requireRole(['admin', 'nhanvien']), lichbaoduongController.updateLichBaoDuongStatus);

// --- Xóa 1 lịch bảo dưỡng với trạng thái là chờ xử lý ---
router.delete('/:id', verifyToken, requireRole(['admin']), lichbaoduongController.deleteLichBaoDuong);

module.exports = router;