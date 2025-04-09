const express = require("express");
const router = express.Router();
const phieuxuatController = require("../controllers/phieuxuatController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { docUpload } = require('../middleware/upload');

router.use(verifyToken); // Yêu cầu đăng nhập cho tất cả route phiếu xuất

// Chỉ Admin mới được tạo, xem, xóa phiếu xuất (Ví dụ)
router.get("/", requireRole(['admin']), phieuxuatController.getAllPhieuXuat);
router.get("/:id", requireRole(['admin']), phieuxuatController.getPhieuXuatById);
router.post("/", requireRole(['admin']), phieuxuatController.createPhieuXuat);
// router.delete("/:id", requireRole(['admin']), phieuxuatController.deletePhieuXuat);
router.post('/:id/chungtu', verifyToken, requireRole(['admin']),docUpload.array('chungTuFiles', 5), phieuxuatController.uploadChungTuXuat);

module.exports = router;