const express = require("express");
const tttbController = require("../controllers/tttbController");

const router = express.Router();

router.get("/", tttbController.getAllThongTinThietBi); // lấy danh sách thông tin tb
router.get("/next-id", tttbController.getNextId); // lấy id tiếp theo
router.get("/thietbi-list", tttbController.getListThietBi); // lấy ds thiết bị
router.get("/phong-list", tttbController.getListPhong); // lấy danh sách phòng
router.post("/", tttbController.createThongTinThietBi); // tạo thông tin thiết bị
router.get("/:id", tttbController.getThongTinThietBiById); // lấy thông tin thiết bị theo id
router.put("/:id", tttbController.updateThongTinThietBi); // cập nhật thông tin thiết bị
router.delete("/:id", tttbController.deleteThongTinThietBi); // xóa thông tin thiết bị
router.post("/multiple",tttbController.createMultipleThongTinThietBi); // thêm nhiều thông tin thiết bị
router.get("/phong/:phong_id", tttbController.getThietBiTrongPhong); // lấy danh sách thiết bị trong phòng
router.put("/thietbi/:id/remove-from-phong", tttbController.deleteThongTinThietBi); // xóa thiết bị trong phòng
router.post("/phong/:phongId/themthietbicosan", tttbController.createThietBiCoSan); // thêm thiết bị có sẵn 
router.get("/theloai", tttbController.getTheLoaiList) // lấy danh sách thể loại
router.get("/thietbi/:theLoai", tttbController.getThietBiByTheLoai); // lấy danh sách thiết bị theo thể loại
router.post("/themthietbivaophong", tttbController.createThemThietBiVaoPhong); // thêm thiết bị vào phòng

module.exports = router;
