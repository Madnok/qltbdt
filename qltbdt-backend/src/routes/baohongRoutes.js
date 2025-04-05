const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const baohongController = require("../controllers/baohongController");
const router = express.Router();

router.post("/guibaohong", baohongController.postGuiBaoHong ); // Gửi Báo Hỏng

router.use(verifyToken);

router.get("/", baohongController.getThongTinBaoHong); // Lấy tất cả thông tin báo hỏng


module.exports = router;