const express = require("express");
const nhapController = require("../controllers/nhapController");
const router = express.Router();

router.get("/", nhapController.getAllPhieuNhap);
router.get("/:id", nhapController.getPhieuNhapById);
router.get("/user/:userId", nhapController.getHoTenByUserId); // Lấy họ tên theo user_id
router.post("/", nhapController.createPhieuNhap); // Tạo phiếu nhập
router.get("/:phieuNhapId/thongtinthietbi",nhapController.getThietBiInPhieuNhap);
router.delete("/:id", nhapController.deletePhieuNhap); // 
router.put("/:id", nhapController.updatePhieuNhap); // Cập nhật phiếu nhập theo id
module.exports = router;