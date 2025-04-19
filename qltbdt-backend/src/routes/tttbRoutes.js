const express = require("express");
const tttbController = require("../controllers/tttbController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(verifyToken);

// --- Route cho Module "Quản Lý Tài Sản" ---
router.get("/taisan", requireRole(['admin', 'nhanvien']), tttbController.getAllTaiSanChiTiet); // API chính lấy danh sách
router.put("/taisan/:id/tinhtrang", requireRole(['admin', 'nhanvien']), tttbController.updateTinhTrangTaiSan); // API cập nhật trạng thái (VD: chờ thanh lý)
router.post("/taisan/:id/phanbo", requireRole(['admin']), tttbController.phanBoTaiSanVaoPhong); // API phân bổ vào phòng


router.get("/next-id", tttbController.getNextId); // lấy id tiếp theo
router.get("/", tttbController.getAllThongTinThietBi); // lấy danh sách thông tin tb
router.get("/thietbi-list", tttbController.getListThietBi); // lấy ds thiết bị
router.get("/phong-list", tttbController.getListPhong); // lấy danh sách phòng
router.get("/:id", tttbController.getThongTinThietBiById); // lấy thông tin thiết bị theo id
router.get("/phong/:phong_id", tttbController.getThietBiTrongPhong); // lấy danh sách thiết bị trong phòng
router.get("/theloai", tttbController.getTheLoaiList) // lấy danh sách thể loại
router.get('/thietbi/:maThietBi', tttbController.getTTTBByMaThietBi);
router.get("/thietbi/:theLoai", tttbController.getThietBiByTheLoai); // lấy danh sách thiết bị theo thể loại

module.exports = router;
