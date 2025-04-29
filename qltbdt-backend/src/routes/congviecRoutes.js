const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const congviecController = require("../controllers/congviecController");
const router = express.Router();
router.use(verifyToken);

router.get("/nhanvien", congviecController.getNhanVien);
router.get("/", congviecController.getAllLichTruc); // Hoặc có thể là GET /?startDate=...&endDate=...
router.post("/themlichtruc", congviecController.addLichTruc); // Giữ lại nếu vẫn cần thêm đơn lẻ

// --- THÊM ROUTE MỚI ---
router.put("/:id", congviecController.updateLichTruc); // Sửa một lịch trực
router.delete("/:id", congviecController.deleteLichTruc); // Xóa một lịch trực
router.post("/bulk-save", congviecController.saveBulkChanges); // Lưu nhiều thay đổi


module.exports = router;