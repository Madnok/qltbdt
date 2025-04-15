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
    if (!nhanvien_id || !baohong_id || isNaN(parseInt(baohong_id)) || !phong_id || !hoatdong || !ketQuaXuLy || !phuongAnXuLy) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc (bao gồm ID Báo hỏng hợp lệ, Phòng, Hoạt động, Kết quả, Phương án)." });
    }
    if (phuongAnXuLy === 'Khác' && (!phuongAnKhacChiTiet || phuongAnKhacChiTiet.trim() === '')) {
        return res.status(400).json({ error: "Vui lòng nhập chi tiết cho phương án xử lý 'Khác'." });
    }
    if (suDungVatTu === true && (!ghiChuVatTu || !hinhAnhHoaDonUrls || hinhAnhHoaDonUrls.length === 0)) {
        return res.status(400).json({ error: "Vui lòng cung cấp chi tiết vật tư, dịch vụ và hình ảnh hóa đơn." });
    }


    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lưu log vào bảng `baotri`
        const sqlInsertLog =
            `INSERT INTO baotri (
                 baohong_id, nhanvien_id, thongtinthietbi_id, phong_id, hoatdong,
                 ketQuaXuLy, phuongAnXuLy, phuongAnKhacChiTiet,
                 suDungVatTu, ghiChuVatTu, chiPhi,
                 hinhAnhHoaDonUrls, hinhAnhHongHocUrls,
                 ngayDuKienTra,
                 thoiGian
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
        const logParams = [
            parseInt(baohong_id),
            nhanvien_id,
            (thongtinthietbi_id !== null && thongtinthietbi_id !== undefined && !isNaN(parseInt(thongtinthietbi_id))) ? parseInt(thongtinthietbi_id) : null,
            phong_id, hoatdong, ketQuaXuLy,
            phuongAnXuLy,
            (phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet : null),
            suDungVatTu === true,
            suDungVatTu === true ? ghiChuVatTu : null,
            (suDungVatTu === true && chiPhi && !isNaN(parseInt(chiPhi))) ? parseInt(chiPhi) : null,
            hinhAnhHoaDonUrls && hinhAnhHoaDonUrls.length > 0 ? JSON.stringify(hinhAnhHoaDonUrls) : null,
            hinhAnhHongHocUrls && hinhAnhHongHocUrls.length > 0 ? JSON.stringify(hinhAnhHongHocUrls) : null,
            (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành' ? ngayDuKienTra || null : null)
        ];

        const [logResult] = await connection.query(sqlInsertLog, logParams);

        // 2. Cập nhật `baohong.coLogBaoTri = TRUE` 
        await connection.query("UPDATE baohong SET coLogBaoTri = TRUE WHERE id = ?", [parseInt(baohong_id)]);

        // 3. Cập nhật thongtinthietbi 
        const isThietBiIdValid = thongtinthietbi_id !== null && thongtinthietbi_id !== undefined && !isNaN(parseInt(thongtinthietbi_id));
        if (isThietBiIdValid) {
            const tttbIdInt = parseInt(thongtinthietbi_id);
            if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = 'dang_bao_hanh', ngayDuKienTra = ? WHERE id = ?", [ngayDuKienTra || null, tttbIdInt]);
            }
            else if (ketQuaXuLy === 'Đề xuất thanh lý') {
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = 'de_xuat_thanh_ly', ngayDuKienTra = NULL WHERE id = ?", [tttbIdInt]);
            }
            else if (ketQuaXuLy === 'Đã sửa chữa xong' || ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý') {
                const currentStatusInfo = await getCurrentDeviceStatusAndWarranty(connection, tttbIdInt);
                const finalStatus = determineFinalStatusInternal(currentStatusInfo.ngayBaoHanhKetThuc);
                await connection.query("UPDATE thongtinthietbi SET tinhTrang = ?, ngayDuKienTra = NULL WHERE id = ?", [finalStatus, tttbIdInt]);
            }
        }

        //  4. CẬP NHẬT TRẠNG THÁI BÁO HỎNG 
        const bhIdInt = parseInt(baohong_id);
        let nextBaoHongStatus = null;

        if (phuongAnXuLy === 'Bảo hành' && ketQuaXuLy === 'Đã gửi bảo hành') {
            // Nếu gửi bảo hành, chuyển trạng thái Báo hỏng sang "Chờ Hoàn Tất Bảo Hành"
            nextBaoHongStatus = 'Chờ Hoàn Tất Bảo Hành';
        } else if (ketQuaXuLy === 'Không tìm thấy lỗi / Không cần xử lý' || (phuongAnXuLy === 'Tự Sửa Chữa' && ketQuaXuLy === 'Đã sửa chữa xong')) {
            nextBaoHongStatus = 'Hoàn Thành';
             // Không cần chờ xem xét nếu đã tự hoàn thành
        } else if (ketQuaXuLy === 'Đề xuất thanh lý' || phuongAnXuLy === 'Khác' || phuongAnXuLy === 'Bàn Giao Cho Bộ Phận Khác') {
             // Các trường hợp cần admin xem xét (đề xuất TL, bàn giao, phương án khác...)
             nextBaoHongStatus = 'Chờ Xem Xét';
        }

        // Thực hiện cập nhật trạng thái Báo hỏng nếu có trạng thái mới
        if (nextBaoHongStatus) {
            let updateBaoHongQuery = "UPDATE baohong SET trangThai = ?";
            const updateBaoHongParams = [nextBaoHongStatus];

            // Nếu Hoàn Thành, cập nhật thêm thời gian xử lý
            if (nextBaoHongStatus === 'Hoàn Thành') {
                updateBaoHongQuery += ", thoiGianXuLy = NOW()"; // Cập nhật thoiGianXuLy khi Hoàn Thành
            }

            updateBaoHongQuery += " WHERE id = ?";
            updateBaoHongParams.push(bhIdInt);

            await connection.query(updateBaoHongQuery, updateBaoHongParams);
        }

        await connection.commit();
        res.status(201).json({ message: "Ghi nhận hoạt động bảo trì thành công.", logId: logResult.insertId });

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