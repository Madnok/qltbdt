const express = require("express");
const router = express.Router();
const phongController = require("../controllers/phongController");


router.get("/", phongController.getAllPhong);
router.get("/phonglist", phongController.getListPhong);
router.get("/danhsach-thietbi/:phong_id", phongController.getThietBiTrongPhong);
router.post("/xoathietbi", phongController.removeThietBiFromPhong);
router.get("/:id", phongController.getPhongById);
router.post("/", phongController.addPhong);
router.put("/:id", phongController.updatePhong);
router.delete("/:id", phongController.deletePhong);
router.post("/add-thietbi", phongController.addThietBiToPhong);


module.exports = router;
