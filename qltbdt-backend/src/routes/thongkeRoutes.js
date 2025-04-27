const express = require('express');
const router = express.Router();
const thongkeController = require('../controllers/thongkeController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Áp dụng xác thực và yêu cầu quyền Admin cho tất cả các route thống kê
router.use(verifyToken);
router.use(requireRole(['admin'])); // Chỉ Admin được xem thống kê

// Định nghĩa các route cho từng loại thống kê
router.get('/tai-chinh', thongkeController.getFinancialSummary);          // 1. Tổng thu chi, tổng giá trị tài sản
router.get('/thiet-bi/theo-trang-thai', thongkeController.getDeviceCountsByStatus); // 2. Số lượng thiết bị theo trạng thái
router.get('/thiet-bi/theo-phong', thongkeController.getDeviceCountsByRoom);     // 3. Số lượng thiết bị trong mỗi phòng
router.get('/bao-hong/theo-phong-loai', thongkeController.getReportCounts);    // 4. Số lượng báo hỏng theo phòng và loại
router.get('/phieu/theo-thang', thongkeController.getTicketCountsByMonth);     // 5. Số lượng phiếu nhập/xuất (theo tháng)
router.get('/bao-hong/theo-thang', thongkeController.getReportCountsByMonthYear); // 6. Lấy số lượng báo hỏng theo tháng
router.get('/chi-phi-bao-tri/theo-thang', thongkeController.getMaintenanceCostsByMonth); // 7. Chi phí BT theo tháng
router.get('/thiet-bi-chi-tiet', thongkeController.getDeviceListByStatus); // 8. Lấy list TB theo trạng thái
router.get('/tong-thu/theo-thang', thongkeController.getRevenueByMonth);       // 9. Lấy tổng thu theo tháng/năm
router.get('/tong-chi/theo-thang', thongkeController.getExpenditureByMonth);   // 10. Lấy tổng chi theo tháng/năm


module.exports = router;