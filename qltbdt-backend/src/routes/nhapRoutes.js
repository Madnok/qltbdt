const express = require("express");
const nhapController = require("../controllers/nhapController");
const router = express.Router();

router.get("/", nhapController.getAllPhieuNhap);
router.get("/:id", nhapController.getPhieuNhapById);

module.exports = router;