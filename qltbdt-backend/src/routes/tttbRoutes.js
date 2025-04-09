const express = require("express");
const tttbController = require("../controllers/tttbController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(verifyToken);

// --- Route cho Module "Quản Lý Tài Sản" ---
router.get("/taisan", requireRole(['admin', 'nhanvien']), tttbController.getAllTaiSanChiTiet); // API chính lấy danh sách
router.put("/taisan/:id/tinhtrang", requireRole(['admin']), tttbController.updateTinhTrangTaiSan); // API cập nhật trạng thái (VD: chờ thanh lý)
router.post("/taisan/:thongtinthietbi_id/phanbo", requireRole(['admin']), tttbController.assignTaiSanToPhong); // API phân bổ vào phòng

router.get("/", tttbController.getAllThongTinThietBi); // lấy danh sách thông tin tb
router.get("/next-id", tttbController.getNextId); // lấy id tiếp theo
router.get("/unassigned", tttbController.getUnassignedThongTinThietBi) // lấy danh sách thông tin tb chưa được gán vào phòng
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

// --- Các Route có rồi tùy chỉnh role
// router.get("/", tttbController.getAllThongTinThietBi); // API này có thể không cần nữa nếu dùng /taisan
// router.get("/next-id", tttbController.getNextId);
// router.get("/unassigned", requireRole(['admin', 'nhanvien']), tttbController.getUnassignedThongTinThietBi); // API lấy thiết bị chưa phân bổ (có thể tích hợp vào /taisan)
// router.get("/thietbi-list", tttbController.getListThietBi);
// router.get("/phong-list", tttbController.getListPhong);
// router.post("/", requireRole(['admin']), tttbController.createThongTinThietBi); // Có thể không cần nếu nhập qua phiếu
// router.get("/:id", tttbController.getThongTinThietBiById); // API lấy chi tiết 1 TTTB
// router.put("/:id", requireRole(['admin']), tttbController.updateThongTinThietBi); // API cập nhật chung (có thể giữ lại hoặc dùng API trạng thái/phân bổ riêng)
// router.delete("/:id", requireRole(['admin']), tttbController.deleteThongTinThietBi); // API xóa hẳn TTTB (cẩn thận khi dùng)
// router.post("/multiple", requireRole(['admin']), tttbController.createMultipleThongTinThietBi); // Dùng cho phiếu nhập




module.exports = router;
