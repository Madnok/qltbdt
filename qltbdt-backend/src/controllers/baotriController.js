const pool = require("../config/db");

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
        baohong_id,
        lichbaoduong_id,
        thongtinthietbi_id,
        phong_id,
        hoatdong,
        ketQuaXuLy,
        phuongAnXuLy,
        phuongAnKhacChiTiet,
        suDungVatTu,
        ghiChuVatTu,
        chiPhi,
        hinhAnhHoaDonUrls,
        hinhAnhHongHocUrls,
        ngayDuKienTra
    } = req.body;

    // Validation 
    if (!nhanvien_id || (!baohong_id && !lichbaoduong_id) || !phong_id || !hoatdong || !ketQuaXuLy || !phuongAnXuLy) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc (bao gồm ID Báo hỏng HOẶC ID Lịch bảo dưỡng, Phòng, Hoạt động, Kết quả, Phương án)." });
    }
    // Thêm kiểm tra kiểu dữ liệu nếu cần (ví dụ: đảm bảo ID là số)
    const parsedBaoHongId = baohong_id ? parseInt(baohong_id) : null;
    const parsedLichBaoDuongId = lichbaoduong_id ? parseInt(lichbaoduong_id) : null;
    const parsedThietBiId = (thongtinthietbi_id !== null && thongtinthietbi_id !== undefined && !isNaN(parseInt(thongtinthietbi_id))) ? parseInt(thongtinthietbi_id) : null;

    if ((baohong_id && isNaN(parsedBaoHongId)) || (lichbaoduong_id && isNaN(parsedLichBaoDuongId))) {
        return res.status(400).json({ error: "ID Báo hỏng hoặc ID Lịch bảo dưỡng không hợp lệ." });
    }
    if (phuongAnXuLy === 'Khác' && (!phuongAnKhacChiTiet || phuongAnKhacChiTiet.trim() === '')) {
        return res.status(400).json({ error: "Vui lòng nhập chi tiết cho phương án xử lý 'Khác'." });
    }
    if (suDungVatTu === true && (!ghiChuVatTu || !hinhAnhHoaDonUrls || hinhAnhHoaDonUrls.length === 0)) {
        return res.status(400).json({ error: "Vui lòng cung cấp chi tiết vật tư, dịch vụ và hình ảnh hóa đơn." });
    }
    // --- Kết thúc Validation ---


    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lưu log vào bảng `baotri`
        const sqlInsertLog =
            `INSERT INTO baotri (
                 baohong_id, lichbaoduong_id, nhanvien_id, thongtinthietbi_id, phong_id, hoatdong,
                 ketQuaXuLy, phuongAnXuLy, phuongAnKhacChiTiet,
                 suDungVatTu, ghiChuVatTu, chiPhi,
                 hinhAnhHoaDonUrls, hinhAnhHongHocUrls,
                 ngayDuKienTra,
                 thoiGian
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const logParams = [
            parsedBaoHongId,
            parsedLichBaoDuongId,
            nhanvien_id,
            parsedThietBiId,
            phong_id, hoatdong, ketQuaXuLy,
            phuongAnXuLy,
            (phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet : null),
            suDungVatTu === true,
            suDungVatTu === true ? ghiChuVatTu : null,
            (suDungVatTu === true && chiPhi && !isNaN(parseFloat(chiPhi))) ? parseFloat(chiPhi) : null, // Sửa thành parseFloat nếu chi phí có thể lẻ
            hinhAnhHoaDonUrls && hinhAnhHoaDonUrls.length > 0 ? JSON.stringify(hinhAnhHoaDonUrls) : null,
            hinhAnhHongHocUrls && hinhAnhHongHocUrls.length > 0 ? JSON.stringify(hinhAnhHongHocUrls) : null,
            (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành' ? ngayDuKienTra || null : null)
        ];

        const [logResult] = await connection.query(sqlInsertLog, logParams);
        const insertedLogId = logResult.insertId;

        // 2. Cập nhật `baohong.coLogBaoTri = TRUE` 
        // --- Xử lý cập nhật Báo Hỏng (nếu có baohong_id) ---
        if (parsedBaoHongId) {
            relatedTableId = parsedBaoHongId;
            await connection.query("UPDATE baohong SET coLogBaoTri = TRUE WHERE id = ?", [relatedTableId]);

            // Xác định trạng thái tiếp theo cho Báo Hỏng
            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
                nextStatus = 'Chờ Hoàn Tất Bảo Hành';
            } else if (ketQuaXuLy === 'Đã nhận từ bảo hành') {
                nextStatus = 'Chờ Xem Xét';
            } else if (ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' || (phuongAnXuLy === 'Tự Sửa Chữa' && ketQuaXuLy === 'Đã sửa chữa xong')) {
                nextStatus = 'Hoàn Thành';
            } else if (ketQuaXuLy === 'Đề xuất thanh lý' || phuongAnXuLy === 'Khác' || phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') {
                nextStatus = 'Chờ Xem Xét';
            }

            // Thực hiện cập nhật trạng thái Báo hỏng nếu có trạng thái mới
            if (nextStatus) {
                updateRelatedTableQuery = "UPDATE baohong SET trangThai = ?";
                updateRelatedTableParams = [nextStatus];

                // Ghi nhận thời gian xử lý nếu trạng thái là Hoàn Thành/Chờ Xem Xét và chưa có
                if (nextStatus === 'Hoàn Thành' || nextStatus === 'Chờ Xem Xét') {
                    const [currentBH] = await connection.query("SELECT thoiGianXuLy FROM baohong WHERE id = ?", [relatedTableId]);
                    if (currentBH.length > 0 && !currentBH[0].thoiGianXuLy) {
                        updateRelatedTableQuery += ", thoiGianXuLy = NOW()";
                    }
                }
                // Reset ghi chú admin (tùy chọn)
                updateRelatedTableQuery += ", ghiChuAdmin = NULL";
                updateRelatedTableQuery += " WHERE id = ?";
                updateRelatedTableParams.push(relatedTableId);

                console.log(`[createLogBaoTri] ID BH ${relatedTableId}: Updating status query: ${updateRelatedTableQuery} with params:`, updateRelatedTableParams);
                await connection.query(updateRelatedTableQuery, updateRelatedTableParams);
            }
        }
        // --- Xử lý cập nhật Lịch Bảo Dưỡng ---
        else if (parsedLichBaoDuongId) {
            relatedTableId = parsedLichBaoDuongId;
            // Cập nhật coLogBaoTri cho lichbaoduong
            await connection.query("UPDATE lichbaoduong SET coLogBaoTri = TRUE WHERE id = ?", [relatedTableId]);

            // Xác định trạng thái tiếp theo cho Lịch Bảo Dưỡng (tương tự baohong)
             if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
                nextStatus = 'Chờ Hoàn Tất Bảo Hành'; // Đảm bảo ENUM có giá trị này
            } else if (ketQuaXuLy === 'Đã nhận từ bảo hành') {
                // Khi nhận về, coi như hoàn thành lịch bảo dưỡng
                nextStatus = 'Hoàn thành';
            } else if (ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' || (phuongAnXuLy === 'Tự Sửa Chữa' && ketQuaXuLy === 'Đã sửa chữa xong')) {
                nextStatus = 'Hoàn thành';
            } else if (ketQuaXuLy === 'Đề xuất thanh lý' || phuongAnXuLy === 'Khác' || phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') {
                 nextStatus = 'Hoàn thành';
                 // nextStatus = 'Chờ Xem Xét';
            }

            // Thực hiện cập nhật trạng thái Lịch Bảo Dưỡng nếu có trạng thái mới
            if (nextStatus) {
                updateRelatedTableQuery = "UPDATE lichbaoduong SET trangThai = ?";
                updateRelatedTableParams = [nextStatus];

                 // Có thể thêm logic cập nhật ngày hoàn thành thực tế nếu cần
                 // if (nextStatus === 'Hoàn thành') {
                 //    updateRelatedTableQuery += ", ngay_hoan_thanh_thuc_te = NOW()";
                 // }

                updateRelatedTableQuery += " WHERE id = ?";
                updateRelatedTableParams.push(relatedTableId);

                console.log(`[createLogBaoTri] ID LBD ${relatedTableId}: Updating status query: ${updateRelatedTableQuery} with params:`, updateRelatedTableParams);
                await connection.query(updateRelatedTableQuery, updateRelatedTableParams);
            }
        }
        // 3. Cập nhật thongtinthietbi 
        if (parsedThietBiId) {
            const tttbIdInt = parsedThietBiId;
            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = 'dang_bao_hanh', ngayDuKienTra = ? WHERE id = ?", [ngayDuKienTra || null, tttbIdInt]);
            } else if (ketQuaXuLy === 'Đã nhận từ bảo hành') {
                const currentStatusInfo = await getCurrentDeviceStatusAndWarranty(connection, tttbIdInt);
                const finalStatusDevice = determineFinalStatusInternal(currentStatusInfo.ngayBaoHanhKetThuc);
                console.log(`[createLogBaoTri] Task ID ${relatedTableId}, TTTB ${tttbIdInt}: Nhận BH về, cập nhật TTTB thành ${finalStatusDevice}`);
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = ?, ngayDuKienTra = NULL WHERE id = ?", [finalStatusDevice, tttbIdInt]);
            } else if (ketQuaXuLy === 'Đề xuất thanh lý') {
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?", [tttbIdInt]);
            } else if (ketQuaXuLy === 'Đã sửa chữa xong' || ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý') {
                 // Chỉ cập nhật nếu trạng thái hiện tại không phải là đang bảo hành/chờ thanh lý
                 const currentStatusInfo = await getCurrentDeviceStatusAndWarranty(connection, tttbIdInt);
                 if (!['dang_bao_hanh', 'cho_thanh_ly', 'da_thanh_ly', 'de_xuat_thanh_ly'].includes(currentStatusInfo.tinhTrang)) {
                    const finalStatus = determineFinalStatusInternal(currentStatusInfo.ngayBaoHanhKetThuc);
                    await connection.query("UPDATE thongtinthietbi SET tinhTrang = ?, ngayDuKienTra = NULL WHERE id = ?", [finalStatus, tttbIdInt]);
                 } else {
                     console.log(`[createLogBaoTri] Task ID ${relatedTableId}, TTTB ${tttbIdInt}: Giữ nguyên trạng thái TTTB '${currentStatusInfo.tinhTrang}' vì đang trong quy trình đặc biệt.`);
                 }
            }
        }
        
        await connection.commit();
        console.log(`[createLogBaoTri] Log ${insertedLogId} cho Task ID ${relatedTableId}: Transaction committed successfully.`);
        res.status(201).json({ message: "Ghi nhận hoạt động bảo trì thành công.", logId: insertedLogId });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Lỗi server khi ghi nhận bảo trì." });
    } finally {
        if (connection) connection.release();
    }
};

// Lấy lịch sử log của một báo hỏng
exports.getBaoHongLog = async (req, res) => {
    const { baohong_id } = req.params;
    if (!baohong_id || isNaN(parseInt(baohong_id))) {
        return res.status(400).json({ error: "ID báo hỏng không hợp lệ." });
    }
    try {
        const [logs] = await pool.query(
            `SELECT bt.*, u.hoTen as tenNhanVien
             FROM baotri bt
             JOIN users u ON bt.nhanvien_id = u.id
             WHERE bt.baohong_id = ?
             ORDER BY bt.thoiGian DESC`,
            [baohong_id]
        );

        // Xử lý URL ảnh cho cả 2 cột
        const formattedLogs = logs.map(log => {
            // Hàm helper để xử lý parse URL (tránh lặp code)
            const getUrlsFromArrayOrNull = (data) => {
                if (Array.isArray(data)) {
                    return data; // Đã là mảng, dùng luôn
                }
                if (data && typeof data === 'string' && data.trim() !== '') {
                    try {
                        const parsed = JSON.parse(data);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.error(`Lỗi parse JSON cho log ${log.id}:`, e, "Giá trị gốc:", data);
                        return []; // Trả về mảng rỗng nếu lỗi parse
                    }
                }
                return []; // Trả về mảng rỗng nếu null, undefined, chuỗi rỗng, hoặc không phải mảng/chuỗi hợp lệ
            };

            return {
                ...log,
                // Xử lý cả 2 cột URL ảnh
                hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
                hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
            };
        });

        res.json(formattedLogs);
    } catch (error) {
        console.error(`Error fetching logs for baohong ${baohong_id}:`, error);
        res.status(500).json({ error: "Lỗi server khi lấy lịch sử bảo trì." });
    }
};

// === HÀM MỚI: Lấy tất cả log bảo trì theo ID thiết bị cụ thể ===
exports.getLogsByThietBiId = async (req, res) => {
    const { thongtinthietbi_id } = req.params;

    if (!thongtinthietbi_id || isNaN(parseInt(thongtinthietbi_id))) {
        return res.status(400).json({ message: "ID thông tin thiết bị không hợp lệ." });
    }

    try {
        // Truy vấn lấy tất cả log cho thiết bị, JOIN với users để lấy tên NV
        // Sắp xếp theo thời gian gần nhất trước
        const query = `
            SELECT
                bt.*,
                u.hoTen AS tenNhanVienThucHien,
                bh.moTa AS moTaBaoHongGoc -- Lấy mô tả từ báo hỏng gốc (nếu baohong_id không NULL)
            FROM baotri bt
            LEFT JOIN users u ON bt.nhanvien_id = u.id  -- LEFT JOIN vì nhanvien_id có thể NULL (vd: log xóa tự động)
            LEFT JOIN baohong bh ON bt.baohong_id = bh.id -- LEFT JOIN vì baohong_id có thể NULL (do ON DELETE SET NULL)
            WHERE bt.thongtinthietbi_id = ?
            ORDER BY bt.thoiGian DESC
        `;

        const [logs] = await pool.query(query, [parseInt(thongtinthietbi_id)]);

        // Xử lý parse JSON cho các cột URL ảnh (tương tự như trong getBaoHongLog)
        const getUrlsFromArrayOrNull = (data) => {
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'string' && data.trim() !== '') {
                try {
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) { return []; }
            }
            return [];
        };

        const formattedLogs = logs.map(log => ({
            ...log,
            hinhAnhHoaDonUrls: getUrlsFromArrayOrNull(log.hinhAnhHoaDonUrls),
            hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
        }));

        if (formattedLogs.length === 0) {
            res.json([]);
        } else {
            res.json(formattedLogs);
        }

    } catch (error) {
        console.error(`Error fetching logs for thongtinthietbi ${thongtinthietbi_id}:`, error);
        res.status(500).json({ message: "Lỗi server khi lấy lịch sử bảo trì thiết bị." }); // Đổi error thành message
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

// Lấy lịch sử log của một lịch bảo dưỡng cụ thể
exports.getLogsByLichBaoDuongId = async (req, res) => {
    const { lichbaoduong_id } = req.params;

    if (!lichbaoduong_id || isNaN(parseInt(lichbaoduong_id))) {
        return res.status(400).json({ error: "ID lịch bảo dưỡng không hợp lệ." });
    }
    const parsedLichBaoDuongId = parseInt(lichbaoduong_id);

    try {
        const [logs] = await pool.query(
            `SELECT bt.*, u.hoTen as tenNhanVien
             FROM baotri bt
             LEFT JOIN users u ON bt.nhanvien_id = u.id 
             WHERE bt.lichbaoduong_id = ?
             ORDER BY bt.thoiGian DESC`,
            [parsedLichBaoDuongId]
        );

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
            hinhAnhHongHocUrls: getUrlsFromArrayOrNull(log.hinhAnhHongHocUrls)
        }));

        res.json(formattedLogs);

    } catch (error) {
        console.error(`Error fetching logs for lichbaoduong ${parsedLichBaoDuongId}:`, error);
        res.status(500).json({ error: "Lỗi server khi lấy lịch sử bảo trì." });
    }
};