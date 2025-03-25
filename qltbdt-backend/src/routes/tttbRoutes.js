const express = require("express");
const tttbController = require("../controllers/tttbController");

const router = express.Router();

router.get("/", tttbController.getAllThongTinThietBi);
router.get("/next-id", tttbController.getNextId);
router.get("/thietbi-list", tttbController.getListThietBi);
router.get("/phong-list", tttbController.getListPhong);
router.post("/", tttbController.createThongTinThietBi);
router.get("/:id", tttbController.getThongTinThietBiById);
router.put("/:id", tttbController.updateThongTinThietBi);
router.delete("/:id", tttbController.deleteThongTinThietBi);
router.post("/multiple",tttbController.createMultipleThongTinThietBi);
router.get("/phong/:phong_id", tttbController.getThietBiTrongPhong);
router.put("/thietbi/:id/remove-from-phong", tttbController.deleteThongTinThietBi);
router.post("/phong/:phongId/themthietbicosan", tttbController.createThietBiCoSan);
router.get("/theloai", tttbController.getTheLoaiList)
router.get("/thietbi/:theLoai", tttbController.getThietBiByTheLoai);
router.post("/themthietbivaophong", tttbController.createThemThietBiVaoPhong);

module.exports = router;
