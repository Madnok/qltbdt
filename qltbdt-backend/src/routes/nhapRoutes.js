const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const express = require("express");
const nhapController = require("../controllers/nhapController");
const { docUpload } = require('../middleware/upload');
const router = express.Router();
router.use(verifyToken);

router.get("/", nhapController.getAllPhieuNhap);// lấy phiếu nhập
router.get("/:id", nhapController.getPhieuNhapById); // lấy phiếu nhập theo id
router.get("/user/:userId", nhapController.getHoTenByUserId); // Lấy họ tên theo user_id
router.post("/create-with-details", nhapController.createPhieuNhap); // Tạo phiếu nhập
router.get("/:phieuNhapId/thongtinthietbi",nhapController.getThietBiInPhieuNhap); // lấy tất cả thiết bị trong phiếu nhập
router.post('/:phieuNhapId/chungtu', verifyToken, requireRole(['admin']), docUpload.array('chungTuFiles', 5), nhapController.uploadChungTuNhapAPI); // upload chứng từ



module.exports = router;
