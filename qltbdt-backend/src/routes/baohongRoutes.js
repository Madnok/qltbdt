const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const express = require("express");
const baohongController = require("../controllers/baohongController");
const {uploadReportImage} = require("../middleware/upload");
const router = express.Router();

router.post("/guibaohong", baohongController.postGuiBaoHong ); // Gửi Báo Hỏng

router.post("/upload-image", uploadReportImage.single("hinhAnh"), baohongController.uploadBaoHongImage);

router.use(verifyToken);

router.get("/", requireRole(['admin', 'nhanvien']), baohongController.getThongTinBaoHong);
router.put('/:id', requireRole(['admin', 'nhanvien']), baohongController.updateBaoHong); 
router.get("/assigned/me", requireRole(['nhanvien']), baohongController.getAssignedBaoHong);
router.delete("/:id", requireRole(['admin']), baohongController.deleteBaoHong);


module.exports = router;