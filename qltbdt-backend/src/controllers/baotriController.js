const pool = require("../config/db");
const { getIoInstance } = require('../socket');

async function getCurrentDeviceStatusAndWarranty(conn, deviceId) {
    if (!deviceId) return { tinhTrang: null, ngayBaoHanhKetThuc: null };
    const [rows] = await conn.query("SELECT tinhTrang, ngayBaoHanhKetThuc FROM thongtinthietbi WHERE id = ?", [deviceId]);
    return rows[0] || { tinhTrang: null, ngayBaoHanhKetThuc: null };
}
function determineFinalStatusInternal(warrantyEndDate) {
    if (!warrantyEndDate) return 'het_bao_hanh';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(warrantyEndDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today ? 'con_bao_hanh' : 'het_bao_hanh';
}

// Lấy task đang xử lý của nhân viên
exports.getMyTasks = async (req, res) => {
    const nhanvien_id = req.user?.id;
    if (!nhanvien_id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const query = `
            SELECT
                bh.id, bh.phong_id,
                p.toa, p.tang, p.soPhong,
                bh.thongtinthietbi_id,
                tttb.thietbi_id,
                tttb.tinhTrang AS tinhTrangThietBi,
                tb.tenThietBi,
                bh.moTa, bh.loaithiethai, bh.thiethai, bh.ngayBaoHong,
                bh.trangThai, bh.ghiChuAdmin, bh.coLogBaoTri,
                tttb.ngayBaoHanhKetThuc
            FROM baohong bh
            LEFT JOIN phong p ON bh.phong_id = p.id
            LEFT JOIN thongtinthietbi tttb ON bh.thongtinthietbi_id = tttb.id
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
            WHERE
                bh.nhanvien_id = ?
                AND bh.trangThai IN ('Đang Tiến Hành', 'Yêu Cầu Làm Lại')
            ORDER BY
                bh.ngayBaoHong DESC;
        `;

        const [tasks] = await pool.query(query, [nhanvien_id]);

        const tasksWithDetails = tasks.map(task => ({
            ...task,
            phong_name: task.toa ? `${task.toa}${task.tang}.${task.soPhong}` : `Phòng ID:${task.phong_id}`,
            tenThietBi: task.tenThietBi || null,
            tinhTrangThietBi: task.tinhTrangThietBi || null
        }));

        res.json(tasksWithDetails);

    } catch (error) {
        console.error("Error fetching my tasks:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách công việc." });
    }
};

// Tạo log bảo trì
exports.createLogBaoTri = async (req, res) => {
    const nhanvien_id = req.user?.id;
    const {
        baohong_id, lichbaoduong_id, thongtinthietbi_id, phong_id, hoatdong,
        ketQuaXuLy, phuongAnXuLy, phuongAnKhacChiTiet, suDungVatTu, ghiChuVatTu,
        chiPhi, hinhAnhHoaDonUrls, hinhAnhHongHocUrls, ngayDuKienTra
    } = req.body;

    console.log("[createLogBaoTri] Received request body:", req.body); // Log request body nhận được

    // Validation (giữ nguyên)
    if (!nhanvien_id || (!baohong_id && !lichbaoduong_id) || !phong_id || !hoatdong || !ketQuaXuLy || !phuongAnXuLy) { return res.status(400).json({ error: "Thiếu thông tin bắt buộc..." }); }
    const parsedBaoHongId = baohong_id ? parseInt(baohong_id) : null;
    const parsedLichBaoDuongId = lichbaoduong_id ? parseInt(lichbaoduong_id) : null;
    const parsedThietBiId = (thongtinthietbi_id !== null && thongtinthietbi_id !== undefined && !isNaN(parseInt(thongtinthietbi_id))) ? parseInt(thongtinthietbi_id) : null;
    if ((baohong_id && isNaN(parsedBaoHongId)) || (lichbaoduong_id && isNaN(parsedLichBaoDuongId))) { return res.status(400).json({ error: "ID Báo hỏng hoặc ID Lịch bảo dưỡng không hợp lệ." }); }
    if (phuongAnXuLy === 'Khác' && (!phuongAnKhacChiTiet || phuongAnKhacChiTiet.trim() === '')) { return res.status(400).json({ error: "Vui lòng nhập chi tiết cho phương án xử lý 'Khác'." }); }
    if (suDungVatTu === true && (!ghiChuVatTu || !hinhAnhHoaDonUrls || hinhAnhHoaDonUrls.length === 0)) { return res.status(400).json({ error: "Vui lòng cung cấp chi tiết vật tư, dịch vụ và hình ảnh hóa đơn." }); }

    const connection = await pool.getConnection();
    console.log("[createLogBaoTri] Database connection obtained.");

    try {
        await connection.beginTransaction();
        console.log("[createLogBaoTri] Transaction started.");

        // === BƯỚC 1: Lưu log vào bảng `baotri` ===
        const sqlInsertLog = `INSERT INTO baotri (baohong_id, lichbaoduong_id, nhanvien_id, thongtinthietbi_id, phong_id, hoatdong, ketQuaXuLy, phuongAnXuLy, phuongAnKhacChiTiet, suDungVatTu, ghiChuVatTu, chiPhi, hinhAnhHoaDonUrls, hinhAnhHongHocUrls, ngayDuKienTra, thoiGian) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const logParams = [
            parsedBaoHongId, parsedLichBaoDuongId, nhanvien_id, parsedThietBiId, phong_id, hoatdong, ketQuaXuLy,
            phuongAnXuLy, (phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet : null), suDungVatTu === true,
            suDungVatTu === true ? ghiChuVatTu : null, (suDungVatTu === true && chiPhi && !isNaN(parseFloat(chiPhi))) ? parseFloat(chiPhi) : null,
            hinhAnhHoaDonUrls && hinhAnhHoaDonUrls.length > 0 ? JSON.stringify(hinhAnhHoaDonUrls) : null,
            hinhAnhHongHocUrls && hinhAnhHongHocUrls.length > 0 ? JSON.stringify(hinhAnhHongHocUrls) : null,
            (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành' ? ngayDuKienTra || null : null)
        ];

        let insertedLogId;
        try {
            console.log("[createLogBaoTri] STEP 1: Executing INSERT INTO baotri...");
            console.log("[createLogBaoTri] STEP 1 Params:", logParams);
            const [logResult] = await connection.query(sqlInsertLog, logParams);
            insertedLogId = logResult.insertId;
            console.log(`[createLogBaoTri] STEP 1 SUCCESS: Log inserted with ID: ${insertedLogId}`);
        } catch (dbError) {
            console.error("[createLogBaoTri] STEP 1 FAILED: Error inserting into baotri:", dbError);
            throw dbError; // Ném lỗi để rollback
        }

        // === BƯỚC 2: Cập nhật bảng gốc (baohong hoặc lichbaoduong) ===
        let relatedTableId = null;
        let nextStatus = null;
        let updateRelatedTableQuery = '';
        let updateRelatedTableParams = [];

        // --- Xử lý cập nhật Báo Hỏng ---
        if (parsedBaoHongId) {
            relatedTableId = parsedBaoHongId;
            try {
                console.log(`[createLogBaoTri] STEP 2.1 (BaoHong ID: ${relatedTableId}): Updating coLogBaoTri = TRUE...`);
                await connection.query("UPDATE baohong SET coLogBaoTri = TRUE WHERE id = ?", [relatedTableId]);
                console.log(`[createLogBaoTri] STEP 2.1 SUCCESS.`);
            } catch (dbError) {
                console.error(`[createLogBaoTri] STEP 2.1 FAILED: Error updating coLogBaoTri for baohong ${relatedTableId}:`, dbError);
                throw dbError;
            }

            // Xác định trạng thái tiếp theo cho Báo Hỏng
            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') { nextStatus = 'Chờ Hoàn Tất Bảo Hành'; }
            else if (ketQuaXuLy === 'Đã nhận từ bảo hành') { nextStatus = 'Chờ Xem Xét'; }
            else if (ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' || (phuongAnXuLy === 'Tự Sửa Chữa' && ketQuaXuLy === 'Đã sửa chữa xong')) { nextStatus = 'Hoàn Thành'; }
            else if (ketQuaXuLy === 'Đề xuất thanh lý' || phuongAnXuLy === 'Khác' || phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') { nextStatus = 'Chờ Xem Xét'; }

            // Thực hiện cập nhật trạng thái Báo hỏng nếu có
            if (nextStatus) {
                updateRelatedTableQuery = "UPDATE baohong SET trangThai = ?";
                updateRelatedTableParams = [nextStatus];
                if (nextStatus === 'Hoàn Thành' || nextStatus === 'Chờ Xem Xét') {
                     const [currentBH] = await connection.query("SELECT thoiGianXuLy FROM baohong WHERE id = ?", [relatedTableId]);
                     if (currentBH.length > 0 && !currentBH[0].thoiGianXuLy) { updateRelatedTableQuery += ", thoiGianXuLy = NOW()"; }
                }
                updateRelatedTableQuery += ", ghiChuAdmin = NULL WHERE id = ?";
                updateRelatedTableParams.push(relatedTableId);
                try {
                    console.log(`[createLogBaoTri] STEP 2.2 (BaoHong ID: ${relatedTableId}): Updating status to '${nextStatus}'...`);
                    console.log("[createLogBaoTri] STEP 2.2 Query:", updateRelatedTableQuery);
                    console.log("[createLogBaoTri] STEP 2.2 Params:", updateRelatedTableParams);
                    await connection.query(updateRelatedTableQuery, updateRelatedTableParams);
                    console.log(`[createLogBaoTri] STEP 2.2 SUCCESS.`);
                } catch (dbError) {
                    console.error(`[createLogBaoTri] STEP 2.2 FAILED: Error updating status for baohong ${relatedTableId}:`, dbError);
                    throw dbError;
                }
            } else {
                 console.log(`[createLogBaoTri] STEP 2.2 (BaoHong ID: ${relatedTableId}): No status update needed.`);
            }
        }
        // --- Xử lý cập nhật Lịch Bảo Dưỡng ---
        else if (parsedLichBaoDuongId) {
            relatedTableId = parsedLichBaoDuongId;
            try {
                console.log(`[createLogBaoTri] STEP 2.1 (LichBaoDuong ID: ${relatedTableId}): Updating coLogBaoTri = TRUE...`);
                await connection.query("UPDATE lichbaoduong SET coLogBaoTri = TRUE WHERE id = ?", [relatedTableId]);
                 console.log(`[createLogBaoTri] STEP 2.1 SUCCESS.`);
            } catch (dbError) {
                console.error(`[createLogBaoTri] STEP 2.1 FAILED: Error updating coLogBaoTri for lichbaoduong ${relatedTableId}:`, dbError);
                throw dbError;
            }

            // Xác định trạng thái tiếp theo cho Lịch Bảo Dưỡng
            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') { nextStatus = 'Chờ Hoàn Tất Bảo Hành'; }
            else if (ketQuaXuLy === 'Đã nhận từ bảo hành') { nextStatus = 'Hoàn thành'; } // Nhận về là hoàn thành lịch
            else if (ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' || (phuongAnXuLy === 'Tự Sửa Chữa' && ketQuaXuLy === 'Đã sửa chữa xong')) { nextStatus = 'Hoàn thành'; }
            else if (ketQuaXuLy === 'Đề xuất thanh lý' || phuongAnXuLy === 'Khác' || phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') { nextStatus = 'Hoàn thành'; } // Hoàn thành lịch, chờ admin xử lý TT TB

            // Thực hiện cập nhật trạng thái Lịch Bảo Dưỡng
            if (nextStatus) {
                updateRelatedTableQuery = "UPDATE lichbaoduong SET trang_thai = ? WHERE id = ?";                updateRelatedTableParams = [nextStatus, relatedTableId];
                 try {
                    console.log(`[createLogBaoTri] STEP 2.2 (LichBaoDuong ID: ${relatedTableId}): Updating status to '${nextStatus}'...`);
                    console.log("[createLogBaoTri] STEP 2.2 Query:", updateRelatedTableQuery);
                    console.log("[createLogBaoTri] STEP 2.2 Params:", updateRelatedTableParams);
                    await connection.query(updateRelatedTableQuery, updateRelatedTableParams);
                    console.log(`[createLogBaoTri] STEP 2.2 SUCCESS.`);
                 } catch (dbError) {
                    console.error(`[createLogBaoTri] STEP 2.2 FAILED: Error updating status for lichbaoduong ${relatedTableId}:`, dbError);
                    throw dbError;
                 }
            } else {
                 console.log(`[createLogBaoTri] STEP 2.2 (LichBaoDuong ID: ${relatedTableId}): No status update needed.`);
            }
        }

        // === BƯỚC 3: Cập nhật thongtinthietbi (nếu có ID thiết bị) ===
        if (parsedThietBiId) {
            const tttbIdInt = parsedThietBiId;
            let updateTTTBQuery = '';
            let updateTTTBParams = [];

            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
                updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = 'dang_bao_hanh', ngayDuKienTra = ? WHERE id = ?";
                updateTTTBParams = [ngayDuKienTra || null, tttbIdInt];
            } else if (ketQuaXuLy === 'Đã nhận từ bảo hành') {
                const currentStatusInfo = await getCurrentDeviceStatusAndWarranty(connection, tttbIdInt);
                const finalStatusDevice = determineFinalStatusInternal(currentStatusInfo.ngayBaoHanhKetThuc);
                updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = ?, ngayDuKienTra = NULL WHERE id = ?";
                updateTTTBParams = [finalStatusDevice, tttbIdInt];
            } else if (ketQuaXuLy === 'Đề xuất thanh lý') {
                updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?";
                updateTTTBParams = [tttbIdInt]; // <-- LỖI TIỀM ẨN Ở ĐÂY?? Params chỉ có 1 giá trị? -> PHẢI LÀ [tttbIdInt]
                 // SỬA LẠI: params phải là ['de_xuat_thanh_ly', tttbIdInt] nếu query là SET tinhTrang... WHERE id = ?
                 // Hoặc nếu query là SET tinhTrang = 'de_xuat_thanh_ly'... thì params là [tttbIdInt]
                 // --> Query đúng phải là:
                 updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?";
                 updateTTTBParams = [tttbIdInt]; // VẪN SAI -> Phải là: updateTTTBParams = [tttbIdInt];
                 // --> Sửa lại hoàn chỉnh:
                 updateTTTBParams = [tttbIdInt]; // Giữ lại ID
                 // Câu query cần sửa lại param:
                 // query: UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?
                 // -> Params phải là [tttbIdInt]
                 // --> CẦN SỬA LẠI CẢ QUERY VÀ PARAMS CHO TRƯỜNG HỢP NÀY
                 updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?";
                 updateTTTBParams = [tttbIdInt]; // --> VẪN SAI, phải là [tttbIdInt] TRONG PARAMS CHO WHERE, còn 'de_xuat_thanh_ly' là giá trị cố định
                 // -----> CHÍNH XÁC:
                 updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?";
                 updateTTTBParams = [tttbIdInt]; // Dùng ID cho phần WHERE

            } else if (ketQuaXuLy === 'Đã sửa chữa xong' || ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý') {
                 const currentStatusInfo = await getCurrentDeviceStatusAndWarranty(connection, tttbIdInt);
                 if (!['dang_bao_hanh', 'cho_thanh_ly', 'da_thanh_ly', 'de_xuat_thanh_ly'].includes(currentStatusInfo.tinhTrang)) {
                    const finalStatus = determineFinalStatusInternal(currentStatusInfo.ngayBaoHanhKetThuc);
                    updateTTTBQuery = "UPDATE thongtinthietbi SET tinhTrang = ?, ngayDuKienTra = NULL WHERE id = ?";
                    updateTTTBParams = [finalStatus, tttbIdInt];
                 }
            }

            if (updateTTTBQuery) {
                 try {
                    console.log(`[createLogBaoTri] STEP 3 (TTTB ID: ${tttbIdInt}): Updating thongtinthietbi...`);
                    console.log("[createLogBaoTri] STEP 3 Query:", updateTTTBQuery);
                    console.log("[createLogBaoTri] STEP 3 Params:", updateTTTBParams);
                    await connection.query(updateTTTBQuery, updateTTTBParams);
                    console.log(`[createLogBaoTri] STEP 3 SUCCESS.`);
                 } catch (dbError) {
                    console.error(`[createLogBaoTri] STEP 3 FAILED: Error updating thongtinthietbi ${tttbIdInt}:`, dbError);
                    throw dbError;
                 }
            } else {
                 console.log(`[createLogBaoTri] STEP 3 (TTTB ID: ${tttbIdInt}): No update needed for thongtinthietbi.`);
            }
        } else {
             console.log(`[createLogBaoTri] STEP 3: No thongtinthietbi_id provided, skipping update.`);
        }

        // === BƯỚC 4: Commit Transaction ===
        await connection.commit();
        console.log(`[createLogBaoTri] Log ${insertedLogId} for Task ID ${relatedTableId}: Transaction committed successfully.`);
        
        try {
            const io = getIoInstance();
            if (io) {
                // Luôn emit cho thiết bị vì log bảo trì liên quan đến thiết bị
                 if (parsedThietBiId) {
                     io.emit('stats_updated', { type: 'thietbi' });
                 }
                 // Emit cho báo hỏng nếu log này liên quan đến báo hỏng
                 if (parsedBaoHongId) {
                     io.emit('stats_updated', { type: 'baohong' });
                 }
                // Emit cho tài chính nếu có chi phí được ghi nhận
                if (suDungVatTu === true && chiPhi && !isNaN(parseFloat(chiPhi)) && parseFloat(chiPhi) > 0) {
                     io.emit('stats_updated', { type: 'taichinh' });
                 }
            }
        } catch (socketError) {
            console.error(`[createLogBaoTri Log ID: ${insertedLogId}] Socket emit error:`, socketError);
        }

        res.status(201).json({ message: "Ghi nhận hoạt động bảo trì thành công.", logId: insertedLogId });

    } catch (error) {
        console.error("[createLogBaoTri] Transaction failed. Rolling back.", error); // Log lỗi đầy đủ trước khi rollback
        await connection.rollback();
        console.log("[createLogBaoTri] Transaction rolled back.");
        // Trả về lỗi chi tiết hơn nếu có thể (ví dụ: lỗi từ DB)
        res.status(500).json({ error: "Lỗi server khi ghi nhận bảo trì.", details: error.message });
    } finally {
        if (connection) {
            connection.release();
            console.log("[createLogBaoTri] Database connection released.");
        }
    }
};



// Upload ảnh hóa đơn
exports.uploadInvoiceImage = (req, res) => {
    // Middleware upload đã xử lý việc tải lên Cloudinary
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Không có file nào được tải lên.' });
    }
    // Trả về mảng các URL của các ảnh đã upload
    const imageUrls = req.files.map(file => file.path);
    res.json({ imageUrls });
};


// Lấy lịch sử log của một báo hỏng
// exports.getBaoHongLog = async (req, res) => {
//     const { baohong_id } = req.params;
//     if (!baohong_id || isNaN(parseInt(baohong_id))) {
//         return res.status(400).json({ error: "ID báo hỏng không hợp lệ." });
//     }
//     try {
//         const [logs] = await pool.query(
//             `SELECT bt.*, u.hoTen as tenNhanVien
//              FROM baotri bt
//              JOIN users u ON bt.nhanvien_id = u.id
//              WHERE bt.baohong_id = ?
//              ORDER BY bt.thoiGian DESC`,
//             [baohong_id]
//         );

//         // Xử lý URL ảnh cho cả 2 cột
//         const formattedLogs = logs.map(log => {
//             // Hàm helper để xử lý parse URL (tránh lặp code)
//             const getUrlsFromArrayOrNull = (data) => {
//                 if (Array.isArray(data)) {
//                     return data; // Đã là mảng, dùng luôn
//                 }
//                 if (data && typeof data === 'string' && data.trim() !== '') {
//                     try {
//                         const parsed = JSON.parse(data);
//                         return Array.isArray(parsed) ? parsed : [];
//                     } catch (e) {
//                         console.error(`Lỗi parse JSON cho log ${log.id}:`, e, "Giá trị gốc:", data);
//                         return []; // Trả về mảng rỗng nếu lỗi parse
//                     }
//                 }
//                 return []; // Trả về mảng rỗng nếu null, undefined, chuỗi rỗng, hoặc không phải mảng/chuỗi hợp lệ
//             };

//             return {
//                 ...log,
//                 // Xử lý cả 2 cột URL ảnh
//                 hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
//                 hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
//             };
//         });

//         res.json(formattedLogs);
//     } catch (error) {
//         console.error(`Error fetching logs for baohong ${baohong_id}:`, error);
//         res.status(500).json({ error: "Lỗi server khi lấy lịch sử bảo trì." });
//     }
// };

// // === HÀM MỚI: Lấy tất cả log bảo trì theo ID thiết bị cụ thể ===
// exports.getLogsByThietBiId = async (req, res) => {
//     const { thongtinthietbi_id } = req.params;

//     if (!thongtinthietbi_id || isNaN(parseInt(thongtinthietbi_id))) {
//         return res.status(400).json({ message: "ID thông tin thiết bị không hợp lệ." });
//     }

//     try {
//         // Truy vấn lấy tất cả log cho thiết bị, JOIN với users để lấy tên NV
//         // Sắp xếp theo thời gian gần nhất trước
//         const query = `
//             SELECT
//                 bt.*,
//                 u.hoTen AS tenNhanVienThucHien,
//                 bh.moTa AS moTaBaoHongGoc -- Lấy mô tả từ báo hỏng gốc (nếu baohong_id không NULL)
//             FROM baotri bt
//             LEFT JOIN users u ON bt.nhanvien_id = u.id  -- LEFT JOIN vì nhanvien_id có thể NULL (vd: log xóa tự động)
//             LEFT JOIN baohong bh ON bt.baohong_id = bh.id -- LEFT JOIN vì baohong_id có thể NULL (do ON DELETE SET NULL)
//             WHERE bt.thongtinthietbi_id = ?
//             ORDER BY bt.thoiGian DESC
//         `;

//         const [logs] = await pool.query(query, [parseInt(thongtinthietbi_id)]);

//         // Xử lý parse JSON cho các cột URL ảnh (tương tự như trong getBaoHongLog)
//         const getUrlsFromArrayOrNull = (data) => {
//             if (Array.isArray(data)) return data;
//             if (data && typeof data === 'string' && data.trim() !== '') {
//                 try {
//                     const parsed = JSON.parse(data);
//                     return Array.isArray(parsed) ? parsed : [];
//                 } catch (e) { return []; }
//             }
//             return [];
//         };

//         const formattedLogs = logs.map(log => ({
//             ...log,
//             hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
//             hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
//         }));

//         if (formattedLogs.length === 0) {
//             res.json([]);
//         } else {
//             res.json(formattedLogs);
//         }

//     } catch (error) {
//         console.error(`Error fetching logs for thongtinthietbi ${thongtinthietbi_id}:`, error);
//         res.status(500).json({ message: "Lỗi server khi lấy lịch sử bảo trì thiết bị." }); // Đổi error thành message
//     }
// };

// Lấy lịch sử log của một lịch bảo dưỡng cụ thể
// exports.getLogsByLichBaoDuongId = async (req, res) => {
//     const { lichbaoduong_id } = req.params;

//     if (!lichbaoduong_id || isNaN(parseInt(lichbaoduong_id))) {
//         return res.status(400).json({ error: "ID lịch bảo dưỡng không hợp lệ." });
//     }
//     const parsedLichBaoDuongId = parseInt(lichbaoduong_id);

//     try {
//         const [logs] = await pool.query(
//             `SELECT bt.*, u.hoTen as tenNhanVien
//              FROM baotri bt
//              LEFT JOIN users u ON bt.nhanvien_id = u.id 
//              WHERE bt.lichbaoduong_id = ?
//              ORDER BY bt.thoiGian DESC`,
//             [parsedLichBaoDuongId]
//         );

//         const getUrlsFromArrayOrNull = (data) => {
//             if (Array.isArray(data)) return data;
//             if (data && typeof data === 'string' && data.trim() !== '') {
//                 try {
//                     const parsed = JSON.parse(data);
//                     return Array.isArray(parsed) ? parsed : [];
//                 } catch (e) { console.error(`Lỗi parse JSON cho log:`, e, "Giá trị gốc:", data); return []; }
//             }
//             return [];
//         };

//         const formattedLogs = logs.map(log => ({
//             ...log,
//             hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
//             hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
//         }));

//         res.json(formattedLogs);

//     } catch (error) {
//         console.error(`Error fetching logs for lichbaoduong ${parsedLichBaoDuongId}:`, error);
//         res.status(500).json({ error: "Lỗi server khi lấy lịch sử bảo trì." });
//     }
// };

exports.getLogs = async (req, res) => {
    // Lấy các ID từ query parameters
    const { baohong_id, lichbaoduong_id, thongtinthietbi_id } = req.query;

    let sqlQuery = `
        SELECT
            bt.*,
            u.hoTen AS tenNhanVien,
            bh.moTa AS moTaBaoHongGoc,  -- Lấy mô tả từ báo hỏng gốc
            lbd.mo_ta AS moTaBaoDuongGoc -- Lấy mô tả từ lịch bảo dưỡng gốc
        FROM baotri bt
        LEFT JOIN users u ON bt.nhanvien_id = u.id
        LEFT JOIN baohong bh ON bt.baohong_id = bh.id
        LEFT JOIN lichbaoduong lbd ON bt.lichbaoduong_id = lbd.id
        WHERE `; // Mệnh đề WHERE sẽ được xây dựng động

    const params = [];
    let whereClause = '';

    // Xác định điều kiện WHERE dựa trên query param được cung cấp
    if (lichbaoduong_id) {
        if (isNaN(parseInt(lichbaoduong_id))) return res.status(400).json({ message: "ID lịch bảo dưỡng không hợp lệ." });
        whereClause = 'bt.lichbaoduong_id = ?';
        params.push(parseInt(lichbaoduong_id));
    } else if (baohong_id) {
        if (isNaN(parseInt(baohong_id))) return res.status(400).json({ message: "ID báo hỏng không hợp lệ." });
        whereClause = 'bt.baohong_id = ?';
        params.push(parseInt(baohong_id));
    } else if (thongtinthietbi_id) {
        if (isNaN(parseInt(thongtinthietbi_id))) return res.status(400).json({ message: "ID thông tin thiết bị không hợp lệ." });
        whereClause = 'bt.thongtinthietbi_id = ?';
        params.push(parseInt(thongtinthietbi_id));
    } else {
        // Nếu không có ID nào hợp lệ được cung cấp
        return res.status(400).json({ message: "Cần cung cấp ít nhất một ID (baohong_id, lichbaoduong_id, hoặc thongtinthietbi_id) trong query parameters." });
    }

    // Hoàn thành câu SQL
    sqlQuery += whereClause + " ORDER BY bt.thoiGian DESC";

    try {
        const [logs] = await pool.query(sqlQuery, params);

        // Xử lý parse JSON cho các cột URL ảnh (giữ nguyên helper)
        const getUrlsFromArrayOrNull = (data) => {
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'string' && data.trim() !== '') {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) { console.error(`Lỗi parse JSON cho log:`, e, "Giá trị gốc:", data); return []; }
            }
            return [];
        };

        const formattedLogs = logs.map(log => ({
            ...log,
            hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
            hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls),
            // Thêm mô tả gốc dựa trên loại log (nếu có)
            moTaGoc: log.moTaBaoDuongGoc || log.moTaBaoHongGoc || null
        }));
        res.json(formattedLogs);

    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi lấy lịch sử bảo trì." });
    }
};