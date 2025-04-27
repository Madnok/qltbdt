const pool = require('../config/db');

/**
 * 1. Tổng Thu Chi, Tổng giá trị tài sản
 */
exports.getFinancialSummary = async (req, res) => {
    try {
        // Tính tổng giá trị ban đầu của tài sản chưa thanh lý (Giá trị hiện có)
        const [assetValueResult] = await pool.query(
            `SELECT SUM(giaTriBanDau) as totalCurrentAssetValue
             FROM thongtinthietbi
             WHERE tinhTrang != 'da_thanh_ly' AND giaTriBanDau IS NOT NULL`
        );
        const totalCurrentAssetValue = assetValueResult[0]?.totalCurrentAssetValue || 0;

        // Tính tổng chi phí bảo trì từ bảng baotri
        const [maintenanceCostResult] = await pool.query(
            `SELECT SUM(chiPhi) as totalMaintenanceCost
             FROM baotri
             WHERE chiPhi IS NOT NULL`
        );
        const totalMaintenanceCost = maintenanceCostResult[0]?.totalMaintenanceCost || 0;

         // Tính tổng giá trị thanh lý (Giả định là Tổng Thu)
         const [disposalValueResult] = await pool.query(
            `SELECT SUM(giaTriThanhLy) as totalDisposalValue
             FROM phieuxuat
             WHERE lyDoXuat = 'thanh_ly' AND giaTriThanhLy IS NOT NULL`
        );
        const totalDisposalValue = disposalValueResult[0]?.totalDisposalValue || 0;

        // Tính toán tổng chi 
        const totalRevenue = totalDisposalValue; 

        res.json({
            tongThu: totalRevenue,
            tongGiaTriTaiSanHienCo: totalCurrentAssetValue, 
            tongChiPhiBaoTri: totalMaintenanceCost
        });

    } catch (error) {
        console.error("Lỗi khi lấy thống kê tài chính:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê tài chính." });
    }
};

/**
 * 2. Số lượng thiết bị theo trạng thái
 */
exports.getDeviceCountsByStatus = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT tinhTrang, COUNT(*) as count
             FROM thongtinthietbi
             GROUP BY tinhTrang
             ORDER BY FIELD(tinhTrang, 'con_bao_hanh', 'het_bao_hanh', 'dang_su_dung', 'dang_bao_hanh', 'hong', 'de_xuat_thanh_ly', 'cho_thanh_ly', 'da_thanh_ly', 'mat')` // Sắp xếp theo thứ tự logic
        );
        // Giữ nguyên dạng mảng [{tinhTrang: '...', count: ...}] vì dễ lặp ở frontend hơn
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy số lượng thiết bị theo trạng thái:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê trạng thái thiết bị." });
    }
};

/**
 * 3. Số lượng thiết bị trong mỗi phòng (và trong kho)
 */
exports.getDeviceCountsByRoom = async (req, res) => {
    try {
        // Đếm thiết bị trong từng phòng cụ thể
        const [inRoomsResult] = await pool.query(
            `SELECT
                p.id as phong_id,
                CONCAT(p.toa, p.tang, '.', p.soPhong) as tenPhong,
                COUNT(tttb.id) as count
             FROM thongtinthietbi tttb
             JOIN phong p ON tttb.phong_id = p.id
             WHERE tttb.phong_id IS NOT NULL AND tttb.tinhTrang != 'da_thanh_ly'
             GROUP BY p.id, tenPhong
             ORDER BY tenPhong`
        );

        // Đếm thiết bị trong kho (phong_id IS NULL và chưa thanh lý)
        const [inStockResult] = await pool.query(
            `SELECT COUNT(*) as count
             FROM thongtinthietbi
             WHERE phong_id IS NULL AND tinhTrang NOT IN ('da_thanh_ly')` // Thêm các trạng thái không tính vào kho nếu cần
        );

        // Kết hợp kết quả
        const result = [
            ...inRoomsResult,
            { phong_id: null, tenPhong: 'Trong Kho', count: inStockResult[0]?.count || 0 } // Thêm mục 'Trong Kho'
        ];

        res.json(result); // Trả về một mảng thống nhất
    } catch (error) {
        console.error("Lỗi khi lấy số lượng thiết bị theo phòng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê thiết bị theo phòng." });
    }
};

/**
 * 4. Số lượng báo hỏng theo phòng và theo loại thiết bị
 */
exports.getReportCounts = async (req, res) => {
    try {
        // Thống kê theo phòng (Gom theo phòng, không cần chi tiết trạng thái)
        const [byRoom] = await pool.query(
            `SELECT
                p.id as phong_id,
                CONCAT(p.toa, p.tang, '.', p.soPhong) as tenPhong,
                COUNT(bh.id) as count
             FROM baohong bh
             JOIN phong p ON bh.phong_id = p.id
             WHERE bh.phong_id IS NOT NULL AND bh.trangThai NOT IN ('Hoàn Thành', 'Đã Hủy') -- Chỉ tính báo hỏng đang hoạt động? (Tùy chỉnh)
             GROUP BY p.id, tenPhong
             ORDER BY count DESC` // Sắp xếp theo số lượng giảm dần
        );

        // Thống kê theo loại thiết bị (Gom theo loại, không cần chi tiết trạng thái)
        const [byDeviceType] = await pool.query(
            `SELECT
                tb.id as thietbi_id,
                tb.tenThietBi,
                COUNT(bh.id) as count
             FROM baohong bh
             JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
             JOIN thietbi tb ON tttb.thietbi_id = tb.id
             WHERE bh.thongtinthietbi_id IS NOT NULL AND bh.trangThai NOT IN ('Hoàn Thành', 'Đã Hủy') -- Chỉ tính báo hỏng đang hoạt động? (Tùy chỉnh)
             GROUP BY tb.id, tb.tenThietBi
             ORDER BY count DESC` // Sắp xếp theo số lượng giảm dần
        );

         // Thống kê báo hỏng hạ tầng/khác (không gắn với thiết bị)
         const [byInfra] = await pool.query(
            `SELECT
                bh.loaithiethai,
                COUNT(bh.id) as count
             FROM baohong bh
             WHERE bh.thongtinthietbi_id IS NULL AND bh.loaithiethai != 'Các Loại Thiết Bị' AND bh.trangThai NOT IN ('Hoàn Thành', 'Đã Hủy') -- Chỉ tính báo hỏng đang hoạt động? (Tùy chỉnh)
             GROUP BY bh.loaithiethai
             ORDER BY count DESC`
         );


        res.json({
            byRoom,
            byDeviceType,
            byInfrastructure: byInfra
        });

    } catch (error) {
        console.error("Lỗi khi lấy số lượng báo hỏng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê báo hỏng." });
    }
};

/**
 * 5. Số lượng phiếu nhập/xuất theo thời gian (ví dụ: theo tháng)
 */
exports.getTicketCountsByMonth = async (req, res) => {
    try {
        // Thống kê phiếu nhập theo tháng/năm
        const [phieuNhapResult] = await pool.query(`
            SELECT DATE_FORMAT(ngayTao, '%Y-%m') as month, COUNT(*) as count
            FROM phieunhap
            GROUP BY month
            ORDER BY month DESC
        `);

        // Thống kê phiếu xuất theo tháng/năm
        const [phieuXuatResult] = await pool.query(`
            SELECT DATE_FORMAT(ngayXuat, '%Y-%m') as month, COUNT(*) as count
            FROM phieuxuat
            GROUP BY month
            ORDER BY month DESC
        `);

        res.json({
            phieuNhapTheoThang: phieuNhapResult,
            phieuXuatTheoThang: phieuXuatResult
        });
    } catch (error) {
        console.error("Lỗi khi lấy số lượng phiếu nhập/xuất theo tháng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê phiếu." });
    }
};

/**
 * 6. Số lượng báo hỏng theo tháng/năm
 */
exports.getReportCountsByMonthYear = async (req, res) => {
    try {
        const [reportCounts] = await pool.query(`
            SELECT DATE_FORMAT(ngayBaoHong, '%Y-%m') as month, COUNT(*) as count
            FROM baohong
            GROUP BY month
            ORDER BY month DESC
        `);
        res.json(reportCounts);
    } catch (error) {
        console.error("Lỗi khi lấy số lượng báo hỏng theo tháng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê báo hỏng theo tháng." });
    }
};

/**
 * 7. Chi phí bảo trì theo Tháng/Năm
 */
exports.getMaintenanceCostsByMonth = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DATE_FORMAT(thoiGian, '%Y-%m') as month, SUM(chiPhi) as totalCost
            FROM baotri
            WHERE chiPhi IS NOT NULL AND chiPhi > 0
            GROUP BY month
            ORDER BY month ASC  -- Sắp xếp tăng dần cho biểu đồ đường
        `);
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy chi phí bảo trì theo tháng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê chi phí bảo trì." });
    }
};

/**
 * 8. Lấy danh sách thiết bị chi tiết theo trạng thái
 */
exports.getDeviceListByStatus = async (req, res) => {
    const { tinhTrang } = req.query; // Lấy trạng thái từ query param

    if (!tinhTrang) {
        return res.status(400).json({ error: "Vui lòng cung cấp trạng thái thiết bị." });
    }

    try {
        // Lấy ID, tên thiết bị, và tên phòng (nếu có)
        const [devices] = await pool.query(`
            SELECT
                tttb.id,
                tttb.tenThietBi, -- Giả sử bạn đã lưu tên TB vào tttb khi nhập
                IFNULL(CONCAT(p.toa, p.tang, '.', p.soPhong), 'Trong Kho') as viTri
            FROM thongtinthietbi tttb
            LEFT JOIN phong p ON tttb.phong_id = p.id
            WHERE tttb.tinhTrang = ?
            ORDER BY tttb.id
            LIMIT 50 -- Giới hạn số lượng trả về phòng trường hợp quá nhiều
        `, [tinhTrang]);

        res.json(devices);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thiết bị theo trạng thái:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách thiết bị." });
    }
};
/**
 * 9. Lấy Tổng Thu (Thanh lý) theo Tháng/Năm
 */
exports.getRevenueByMonth = async (req, res) => {
    const { year, month } = req.query; // Lấy năm và tháng (tùy chọn) từ query

    if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year);
    const monthInt = month ? parseInt(month) : null;

    if (monthInt && (isNaN(monthInt) || monthInt < 1 || monthInt > 12)) {
        return res.status(400).json({ error: "Tháng không hợp lệ." });
    }

    try {
        let sqlQuery = `
            SELECT
                DATE_FORMAT(ngayXuat, '%Y-%m') as month,
                SUM(giaTriThanhLy) as totalRevenue
            FROM phieuxuat
            WHERE lyDoXuat = 'thanh_ly' AND giaTriThanhLy IS NOT NULL
              AND YEAR(ngayXuat) = ?
        `;
        const params = [yearInt];

        if (monthInt) {
            sqlQuery += " AND MONTH(ngayXuat) = ?";
            params.push(monthInt);
        }

        sqlQuery += " GROUP BY month ORDER BY month ASC"; // Luôn group by month

        const [rows] = await pool.query(sqlQuery, params);

        // Trả về mảng [{ month: 'YYYY-MM', totalRevenue: value }]
        res.json(rows);

    } catch (error) {
        console.error("Lỗi khi lấy tổng thu theo tháng/năm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê tổng thu." });
    }
};

/**
 * 10. Lấy Tổng Chi (Mua mới + Bảo trì) theo Tháng/Năm
 */
exports.getExpenditureByMonth = async (req, res) => {
    const { year, month } = req.query;

    if (!year || isNaN(parseInt(year))) {
        return res.status(400).json({ error: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year);
    const monthInt = month ? parseInt(month) : null;

    if (monthInt && (isNaN(monthInt) || monthInt < 1 || monthInt > 12)) {
        return res.status(400).json({ error: "Tháng không hợp lệ." });
    }

    try {
        // --- Query 1: Chi phí mua mới (giaTriBanDau) theo tháng nhập hàng ---
        let importCostQuery = `
            SELECT
                DATE_FORMAT(pn.ngayTao, '%Y-%m') as month,
                SUM(tttb.giaTriBanDau) as importCost
            FROM thongtinthietbi tttb
            JOIN phieunhap pn ON tttb.phieunhap_id = pn.id
            WHERE tttb.giaTriBanDau IS NOT NULL
              AND YEAR(pn.ngayTao) = ?
        `;
        const importParams = [yearInt];
        if (monthInt) {
            importCostQuery += " AND MONTH(pn.ngayTao) = ?";
            importParams.push(monthInt);
        }
        importCostQuery += " GROUP BY month";

        const [importCosts] = await pool.query(importCostQuery, importParams);

        // --- Query 2: Chi phí bảo trì theo tháng ghi log ---
        let maintenanceCostQuery = `
            SELECT
                DATE_FORMAT(thoiGian, '%Y-%m') as month,
                SUM(chiPhi) as maintenanceCost
            FROM baotri
            WHERE chiPhi IS NOT NULL AND chiPhi > 0
              AND YEAR(thoiGian) = ?
        `;
        const maintenanceParams = [yearInt];
        if (monthInt) {
            maintenanceCostQuery += " AND MONTH(thoiGian) = ?";
            maintenanceParams.push(monthInt);
        }
        maintenanceCostQuery += " GROUP BY month";

        const [maintenanceCosts] = await pool.query(maintenanceCostQuery, maintenanceParams);

        // --- Kết hợp kết quả ---
        const expenditureMap = {};

        // Thêm chi phí nhập
        importCosts.forEach(item => {
            expenditureMap[item.month] = (expenditureMap[item.month] || 0) + parseFloat(item.importCost);
        });

        // Thêm chi phí bảo trì
        maintenanceCosts.forEach(item => {
            expenditureMap[item.month] = (expenditureMap[item.month] || 0) + parseFloat(item.maintenanceCost);
        });

        // Chuyển map thành mảng kết quả [{ month: 'YYYY-MM', totalExpenditure: value }]
        const results = Object.keys(expenditureMap)
            .map(month => ({
                month: month,
                totalExpenditure: expenditureMap[month]
            }))
            .sort((a, b) => a.month.localeCompare(b.month)); // Sắp xếp theo tháng tăng dần

        res.json(results);

    } catch (error) {
        console.error("Lỗi khi lấy tổng chi theo tháng/năm:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thống kê tổng chi." });
    }
};