const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const lichtrucController = require("../controllers/lichtrucController");
const router = express.Router();
router.use(verifyToken);

router.get("/nhanvien", lichtrucController.getNhanVien);
router.get("/", lichtrucController.getAllLichTruc); // Hoặc có thể là GET /?startDate=...&endDate=...
router.post("/themlichtruc", lichtrucController.addLichTruc); // Giữ lại nếu vẫn cần thêm đơn lẻ

// --- THÊM ROUTE MỚI ---
router.put("/:id", lichtrucController.updateLichTruc); // Sửa một lịch trực
router.delete("/:id", lichtrucController.deleteLichTruc); // Xóa một lịch trực
router.post("/bulk-save", lichtrucController.saveBulkChanges); // Lưu nhiều thay đổi


module.exports = router;