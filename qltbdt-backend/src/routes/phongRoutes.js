const express = require("express");
const router = express.Router();
const phongController = require("../controllers/phongController");


router.get("/", phongController.getAllPhong);
router.get("/:id", phongController.getPhongById);
router.post("/", phongController.addPhong);
router.put("/:id", phongController.updatePhong);
router.delete("/:id", phongController.deletePhong);

module.exports = router;
