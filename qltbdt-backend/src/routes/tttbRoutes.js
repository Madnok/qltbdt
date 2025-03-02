const express = require("express");
const tttbController = require("../controllers/tttbController");

const router = express.Router();

router.get("/", tttbController.getAllThongTinThietBi);
router.get("/next-id", tttbController.getNextId);
router.get("/thietbi-list", tttbController.getListThietBi);
router.get("/phong-list", tttbController.getListPhong);
router.post("/", tttbController.createThongTinThietBi);

module.exports = router;
