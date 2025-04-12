    const express = require("express");
    const router = express.Router();
    const phongController = require("../controllers/phongController");
    const { verifyToken } = require("../middleware/authMiddleware"); // <-- THÊM DÒNG NÀY
    
    router.get("/", phongController.getAllPhong);
    router.get("/phonglist", phongController.getListPhong);
    router.get("/danhsach-thietbi/:phong_id", phongController.getThietBiTrongPhong);

    router.use(verifyToken); 

    router.post("/xoathietbi", verifyToken, phongController.thuHoiTaiSanKhoiPhong);
    router.get("/:id", phongController.getPhongById);
    router.post("/", phongController.addPhong);
    router.put("/:id", phongController.updatePhong);
    router.delete("/:id", phongController.deletePhong);

    module.exports = router;