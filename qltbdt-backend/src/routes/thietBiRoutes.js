const express = require("express");

const thietBiController = require("../controllers/thietbiController");

const router = express.Router();

router.get("/", thietBiController.getAllThietBi);
router.get("/:id", thietBiController.getThietBiById);
router.post("/", thietBiController.createThietBi);
router.put("/:id", thietBiController.updateThietBi);
router.delete("/:id", thietBiController.deleteThietBi);

module.exports = router;
