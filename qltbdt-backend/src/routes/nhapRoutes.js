const express = require("express");
const nhapController = require("../controllers/nhapController");
const router = express.Router();

router.get("/", nhapController.getAllPhieuNhap);
router.get("/:id", nhapController.getPhieuNhapById);
router.get("/next-id", nhapController.getNextPhieuNhapId); // Lấy ID phiếu nhập tiếp theo
router.get("/user/:userId", nhapController.getHoTenByUserId); // Lấy họ tên theo user_id
router.post("/", nhapController.createPhieuNhap); // Tạo phiếu nhập
router.get("/:phieuNhapId/thongtinthietbi",nhapController.getThietBiInPhieuNhap);
router.delete("/:id", nhapController.deletePhieuNhap);
module.exports = router;