const pool = require("../config/db");

// Lấy task đang xử lý của nhân viên
exports.getMyTasks = async (req, res) => {
    const nhanvien_id = req.user?.id;
    if (!nhanvien_id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const [tasks] = await pool.query(
            `SELECT
                bh.id, bh.phong_id, p.toa, p.tang, p.soPhong,
                bh.thietbi_id, tb.tenThietBi, bh.thongtinthietbi_id,
                bh.moTa, bh.loaithiethai, bh.thiethai, bh.ngayBaoHong, bh.trangThai, bh.ghiChuAdmin
             FROM baohong bh
             JOIN phong p ON bh.phong_id = p.id
             LEFT JOIN thietbi tb ON bh.thietbi_id = tb.id
             WHERE bh.nhanvien_id = ? AND bh.trangThai IN ('Đang Tiến Hành', 'Yêu Cầu Làm Lại')
             ORDER BY bh.ngayBaoHong DESC`, // Ưu tiên task mới hơn hoặc theo yêu cầu
            [nhanvien_id]
        );
        // Tạo tên phòng đầy đủ
        const tasksWithPhongName = tasks.map(task => ({
            ...task,
            phong_name: `${task.toa}${task.tang}.${task.soPhong}`
        }));
        res.json(tasksWithPhongName);
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
        thongtinthietbi_id, // Lấy từ thông tin báo hỏng liên quan
        phong_id,           // Lấy từ thông tin báo hỏng liên quan
        hoatdong,
        ketQuaXuLy,
        phuongAnXuLy, // Thêm mới
        phuongAnKhacChiTiet, // Thêm mới
        suDungVatTu,
        ghiChuVatTu,
        chiPhi,
        hinhAnhHoaDonUrls, // Mảng URL ảnh hóa đơn đã upload
        hinhAnhHongHocUrls // Thêm mới (mảng URL ảnh hỏng hóc)
    } = req.body;

    // Validation cơ bản (thêm phuongAnXuLy nếu bắt buộc)
    if (!nhanvien_id || !baohong_id || !phong_id || !hoatdong || !ketQuaXuLy || !phuongAnXuLy) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }
    // Validation cho phương án "Khác"
    if (phuongAnXuLy === 'Khác' && (!phuongAnKhacChiTiet || phuongAnKhacChiTiet.trim() === '')) {
        return res.status(400).json({ error: "Vui lòng nhập chi tiết cho phương án xử lý 'Khác'." });
    }

    if (!nhanvien_id || !baohong_id || !phong_id || !hoatdong || !ketQuaXuLy) {
        return res.status(400).json({ error: "Thiếu thông tin bắt buộc." });
    }

    if (suDungVatTu === true && (!ghiChuVatTu || !hinhAnhHoaDonUrls || hinhAnhHoaDonUrls.length === 0)) {
        return res.status(400).json({ error: "Vui lòng cung cấp chi tiết vật tư và hình ảnh hóa đơn." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lưu log vào bảng `baotri`
        const [logResult] = await connection.query(
            `INSERT INTO baotri (
                baohong_id, nhanvien_id, thongtinthietbi_id, phong_id, hoatdong,
                ketQuaXuLy, phuongAnXuLy, phuongAnKhacChiTiet,
                suDungVatTu, ghiChuVatTu, chiPhi,
                hinhAnhHoaDonUrls, hinhAnhHongHocUrls,
                thoiGian
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                baohong_id, nhanvien_id, thongtinthietbi_id || null, phong_id, hoatdong,
                ketQuaXuLy, phuongAnXuLy || null, // Lưu phương án xử lý
                (phuongAnXuLy === 'Khác' ? phuongAnKhacChiTiet : null), // Chỉ lưu chi tiết nếu là 'Khác'
                suDungVatTu === true,
                suDungVatTu === true ? ghiChuVatTu : null,
                (typeof chiPhi === 'number' ? chiPhi : null), // Đảm bảo chiPhi là số hoặc null
                hinhAnhHoaDonUrls && hinhAnhHoaDonUrls.length > 0 ? JSON.stringify(hinhAnhHoaDonUrls) : null,
                hinhAnhHongHocUrls && hinhAnhHongHocUrls.length > 0 ? JSON.stringify(hinhAnhHongHocUrls) : null // Lưu ảnh hỏng hóc
            ]
        );

        // 2. Cập nhật `baohong.coLogBaoTri = TRUE`
        await connection.query("UPDATE baohong SET coLogBaoTri = TRUE WHERE id = ?", [baohong_id]);

        // 3. Cập nhật `thongtinthietbi.tinhTrang` nếu cần
        let tttbUpdateQuery = "";
        let tttbParams = [];
        if (thongtinthietbi_id) { // Chỉ cập nhật nếu báo hỏng này liên quan đến TTTB cụ thể
            if (ketQuaXuLy === 'Đã gửi bảo hành') {
                tttbUpdateQuery = "UPDATE thongtinthietbi SET tinhTrang = 'dang_bao_hanh' WHERE id = ?";
                tttbParams = [thongtinthietbi_id];
            } else if (ketQuaXuLy === 'Đề xuất thanh lý') {
                tttbUpdateQuery = "UPDATE thongtinthietbi SET tinhTrang = 'cho_thanh_ly' WHERE id = ?";
                tttbParams = [thongtinthietbi_id];
            }
            // Có thể thêm logic cập nhật lại 'con_bao_hanh'/'het_bao_hanh' nếu 'Đã sửa chữa xong'
            // tùy thuộc vào quy trình xác nhận bảo hành trả về
        }

        if (tttbUpdateQuery) {
            await connection.query(tttbUpdateQuery, tttbParams);
        }

        await connection.commit();
        res.status(201).json({ message: "Ghi nhận hoạt động bảo trì thành công.", logId: logResult.insertId });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating maintenance log:", error);
        res.status(500).json({ error: "Lỗi server khi ghi nhận bảo trì." });
    } finally {
        connection.release();
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

// ... các hàm khác ...

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