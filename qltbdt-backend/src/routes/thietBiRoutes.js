const express = require("express");

const thietBiController = require("../controllers/thietbiController");

const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", thietBiController.getAllThietBi);
router.get("/tongsoluongnhap/", thietBiController.getAllThietBiFromPhieuNhap);
router.get("/thongtin/:thietbi_id", thietBiController.getThongTinThietBi);
router.get("/:id", thietBiController.getThietBiById);
router.post("/", thietBiController.createThietBi);
router.put("/:id", thietBiController.updateThietBi);
router.delete("/:id", thietBiController.deleteThietBi);

module.exports = router;
