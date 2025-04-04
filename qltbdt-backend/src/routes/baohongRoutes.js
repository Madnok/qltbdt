const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const baohongController = require("../controllers/baohongController");
const router = express.Router();
router.use(verifyToken);

router.get("/", baohongController.getThongTinBaoHong); // Lấy tất cả thông tin báo hỏng
router.post("/guibaohong", baohongController.postGuiBaoHong ); // Gửi Báo Hỏng

module.exports = router;