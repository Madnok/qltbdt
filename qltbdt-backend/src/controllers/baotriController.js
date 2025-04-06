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
        suDungVatTu,
        ghiChuVatTu,
        chiPhi,
        hinhAnhHoaDonUrls // Mảng URL ảnh hóa đơn đã upload
    } = req.body;

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
            `INSERT INTO baotri (baohong_id, nhanvien_id, thongtinthietbi_id, phong_id, hoatdong, ketQuaXuLy, suDungVatTu, ghiChuVatTu, chiPhi, hinhAnhHoaDonUrls, thoiGian)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                baohong_id, nhanvien_id, thongtinthietbi_id || null, phong_id, hoatdong, ketQuaXuLy,
                suDungVatTu === true, // Chuyển thành boolean
                suDungVatTu === true ? ghiChuVatTu : null,
                chiPhi || null,
                hinhAnhHoaDonUrls ? JSON.stringify(hinhAnhHoaDonUrls) : null // Lưu JSON array
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

        // --- SỬA LỖI XỬ LÝ URL ẢNH ---
        const formattedLogs = logs.map(log => {
            let finalUrls = [];
            // Kiểm tra xem log.hinhAnhHoaDonUrls có phải là một mảng không
            if (Array.isArray(log.hinhAnhHoaDonUrls)) {
                finalUrls = log.hinhAnhHoaDonUrls; // Sử dụng trực tiếp nếu đã là mảng
            } else if (log.hinhAnhHoaDonUrls) {
                // Log cảnh báo nếu giá trị tồn tại nhưng không phải mảng
                 console.warn(`Giá trị hinhAnhHoaDonUrls cho log ${log.id} không phải là một mảng:`, log.hinhAnhHoaDonUrls);
                 try {
                     const parsed = JSON.parse(log.hinhAnhHoaDonUrls);
                     if(Array.isArray(parsed)) finalUrls = parsed;
                 } catch(e) {
                     console.error("Parse lại thất bại:", e)
                 }
            }
            // Nếu không phải mảng hoặc là null/undefined, finalUrls sẽ là []
            return {
                ...log,
                hinhAnhHoaDonUrls: finalUrls // Luôn trả về một mảng
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