const express = require("express");
const gopyController = require("../controllers/gopyController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const router = express.Router();


// Gửi góp ý - Không cần token
router.post("/", gopyController.createGopY);

// Vote - Không cần token (dùng anon_id từ middleware)
router.post("/:id/vote", gopyController.handleVote);

// Lấy danh sách công khai - Không cần token
router.get("/public", gopyController.getPublicGopY);

// ---- Các route yêu cầu đăng nhập ----
router.use(verifyToken); // Áp dụng cho các route bên dưới

// Comment - Yêu cầu đăng nhập và role
router.post("/:id/comment", requireRole(['admin', 'nhanvien']), gopyController.addComment);

// ---- Các route chỉ dành cho Admin ----
// Lấy danh sách cho Admin
router.get("/admin", requireRole(['admin']), gopyController.getAllGopYForAdmin);

// Cập nhật góp ý (trạng thái, người phụ trách) 
router.put("/:id", requireRole(['admin']), gopyController.updateGopY);

// Xóa góp ý 
router.delete("/:id", requireRole(['admin']), gopyController.deleteGopY);


module.exports = router;