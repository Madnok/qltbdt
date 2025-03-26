const express = require("express");
const router = express.Router();
const phongController = require("../controllers/phongController");


router.get("/", phongController.getAllPhong);// lấy danh sách tất cả phòng
router.get("/phonglist", phongController.getListPhong); // lấy danh sách tất cả phòng theo dạng ID và tên phòng (Tòatằng.phòng ví dụ id: 1, phòng: A1.1)
router.get("/danhsach-thietbi/:phong_id", phongController.getThietBiTrongPhong); //lấy danh sách thiết bị trong phòng theo id phòng
router.post("/xoathietbi", phongController.removeThietBiFromPhong); //xóa thiết bị khỏi phòng
router.get("/:id", phongController.getPhongById);// lấy thông tin cơ sở tòa tầng phòng theo id
router.post("/", phongController.addPhong); // thêm phòng
router.put("/:id", phongController.updatePhong); // update phòng
router.delete("/:id", phongController.deletePhong); // xóa phòng    
router.post("/add-thietbi", phongController.addThietBiToPhong); // thêm thiết bị vào phòng


module.exports = router;
