    const express = require("express");
    const router = express.Router();
    const phongController = require("../controllers/phongController");
    const { verifyToken,requireRole } = require("../middleware/authMiddleware"); 
    
    router.get("/", phongController.getAllPhong);
    router.get("/phonglist", phongController.getListPhong);
    router.get('/phonglistassets', phongController.getListPhongCoTaiSan);
    router.get("/danhsach-thietbi/:phong_id", phongController.getThietBiTrongPhong);

    router.use(verifyToken); 

    router.post("/xoathietbi", requireRole(['admin']), verifyToken, phongController.thuHoiTaiSanKhoiPhong);
    router.post('/xoa-nhieu-thietbi', requireRole(['admin']), verifyToken, phongController.thuHoiNhieuTaiSanKhoiPhong);
    router.get("/:id", phongController.getPhongById);
    router.post("/", requireRole(['admin']), phongController.addPhong);
    router.put("/:id", requireRole(['admin']), phongController.updatePhong);
    router.delete("/:id", requireRole(['admin']), phongController.deletePhong);

    module.exports = router;