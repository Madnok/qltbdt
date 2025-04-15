const pool = require("../config/db");

// Lấy danh sách tất cả thông tin thiết bị
exports.getAllThongTinThietBi = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM thongtinthietbi");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết tttb theo ID
exports.getThongTinThietBiById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM thongtinthietbi WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin của thiết bị" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy ID tiếp theo của bảng thongtinthietbi
exports.getNextId = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT MAX(id) AS maxId FROM thongtinthietbi");
        const nextId = (rows[0].maxId || 0) + 1;
        res.json({ nextId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách thiết bị (Dropdown)
exports.getListThietBi = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM thietbi");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách phòng (Dropdown)
exports.getListPhong = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, toa, tang, soPhong FROM phong");
        const phongList = rows.map(p => ({
            id: p.id,
            phong: `${p.toa}${p.tang}.${p.soPhong}`
        }));
        res.json(phongList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm mới một thông tin thiết bị
exports.createThongTinThietBi = async (req, res) => {
    const { thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang, soLuong, thoiGianBaoHanh } = req.body;

    if (!thietbi_id || !soLuong) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin thiết bị, bao gồm số lượng" });
    }

    try {
        // Lấy tên thiết bị từ bảng thietbi
        const [thietbiRows] = await pool.query("SELECT tenThietBi FROM thietbi WHERE id = ?", [thietbi_id]);
        if (thietbiRows.length === 0) {
            return res.status(400).json({ error: "Thiết bị không tồn tại" });
        }

        const tenThietBi = thietbiRows[0].tenThietBi;

        // Tính ngày hết hạn bảo hành
        const ngayBaoHanhKetThuc = thoiGianBaoHanh
            ? new Date(new Date().setMonth(new Date().getMonth() + thoiGianBaoHanh))
            : null;

        // Thêm thiết bị vào bảng thongtinthietbi
        await pool.query(
            `INSERT INTO thongtinthietbi (
                thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang, tenThietBi, soLuong, thoiGianBaoHanh, ngayBaoHanhKetThuc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [thietbi_id, phong_id || null, nguoiDuocCap || null, phieunhap_id, tinhTrang || 'con_bao_hanh', tenThietBi, soLuong, thoiGianBaoHanh || null, ngayBaoHanhKetThuc]
        );

        // Cập nhật tồn kho
        await pool.query(
            "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
            [soLuong, thietbi_id]
        );

        res.status(201).json({ message: "Thêm thông tin thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.createMultipleThongTinThietBi = async (req, res) => {
    const { danhSachThietBi } = req.body;

    if (!Array.isArray(danhSachThietBi) || danhSachThietBi.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const values = danhSachThietBi.map(tb => {
            const ngayHienTai = new Date();

            // Tính ngày hết hạn bảo hành nếu có thời gian bảo hành
            const ngayBaoHanhKetThuc = tb.thoiGianBaoHanh && tb.thoiGianBaoHanh > 0
                ? new Date(ngayHienTai.setMonth(ngayHienTai.getMonth() + tb.thoiGianBaoHanh))
                : null;

            // Xác định tình trạng bảo hành
            const tinhTrang = tb.thoiGianBaoHanh && tb.thoiGianBaoHanh > 0 ? 'con_bao_hanh' : 'het_bao_hanh';

            return [
                tb.thietbi_id,
                tb.phong_id || null,
                tb.nguoiDuocCap || null,
                tb.phieunhap_id,
                tinhTrang,
                tb.tenThietBi,
                tb.soLuong || 0, // Số lượng thiết bị
                tb.thoiGianBaoHanh || null,
                ngayBaoHanhKetThuc
            ];
        });

        // Thêm nhiều bản ghi vào bảng `thongtinthietbi`
        await connection.query(
            `INSERT INTO thongtinthietbi (
                thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang, tenThietBi, soLuong, thoiGianBaoHanh, ngayBaoHanhKetThuc
            ) VALUES ${values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
            values.flat()
        );

        // Cập nhật tồn kho trong bảng `thietbi`
        for (const tb of danhSachThietBi) {
            await connection.query(
                "UPDATE thietbi SET tonKho = tonKho + ? WHERE id = ?",
                [tb.soLuong || 0, tb.thietbi_id]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Thêm nhiều thiết bị thành công!" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
};



// Cập nhật thông tin thiết bị
exports.updateThongTinThietBi = async (req, res) => {
    const { id } = req.params;
    const { thietbi_id, phong_id, nguoiDuocCap, tinhTrang } = req.body;
    try {
        await pool.query(
            "UPDATE thongtinthietbi SET thietbi_id = ?, phong_id = ?, nguoiDuocCap = ?, tinhTrang = ? WHERE id = ?",
            [thietbi_id, phong_id || null, nguoiDuocCap || null, tinhTrang || 'chua_dung', id]
        );
        res.json({ message: "Cập nhật thông tin thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa thông tin thiết bị khỏi phòng (set phong_id = NULL)
exports.deleteThongTinThietBi = async (req, res) => {
    const { id } = req.params;

    try {
        // Lấy thông tin số lượng và thietbi_id trước khi xóa
        const [rows] = await pool.query("SELECT soLuong, thietbi_id FROM thongtinthietbi WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin thiết bị để cập nhật" });
        }

        const { soLuong, thietbi_id } = rows[0];

        // Cập nhật tồn kho
        await pool.query("UPDATE thietbi SET tonKho = tonKho - ? WHERE id = ?", [soLuong, thietbi_id]);

        // Xóa thiết bị khỏi bảng thongtinthietbi
        const [result] = await pool.query("DELETE FROM thongtinthietbi WHERE id = ?", [id]);

        res.json({ message: `Xóa thông tin thiết bị ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa thông tin thiết bị" });
    }
};

// Lấy Danh Sách Thiết Bị Trong Phòng
exports.getThietBiTrongPhong = async (req, res) => {
    const phong_id = parseInt(req.params.phong_id, 10);
    if (isNaN(phong_id)) {
        return res.status(400).json({ error: "ID phòng không hợp lệ." });
    }

    try {
        const [thietBiList] = await pool.query(
            `SELECT
                tttb.id, 
                tttb.tinhTrang,
                tb.tenThietBi AS tenLoaiThietBi,
                tl.theLoai AS tenTheLoai,
                tb.id AS thietbi_id_type 
            FROM thongtinthietbi tttb
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE tttb.phong_id = ?
            ORDER BY tl.theLoai, tb.tenThietBi, tttb.id`,
            [phong_id]
        );

        if (thietBiList.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(thietBiList);
    } catch (error) {
        console.error("Lỗi lấy thiết bị trong phòng:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
    }
};

// Lấy danh sách thể loại (không trùng)
exports.getTheLoaiList = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT DISTINCT theLoai FROM theloai");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy danh sách thiết bị theo thể loại
exports.getThietBiByTheLoai = async (req, res) => {
    const { theLoai } = req.params;
    try {
        const [rows] = await pool.query(
            "SELECT tb.id, tb.tenThietBi FROM thietbi tb JOIN theloai tl ON tb.theloai_id = tl.id WHERE tl.theLoai = ?",
            [theLoai]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ===============================================================================================================//
// // Lấy danh sách TẤT CẢ tài sản chi tiết (cho trang Quản lý Tài sản)
// exports.getAllTaiSanChiTiet = async (req, res) => {
//     try {
//         // Lấy tham số filter và pagination từ query string
//         const { trangThai, phongId, theLoaiId, thietBiId /*, sortBy, order */ } = req.query;
//         const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
//         const limit = parseInt(req.query.limit) || 15; // Số dòng/trang (có thể chỉnh)
//         const offset = (page - 1) * limit; // Tính offset cho SQL

//         // --- Xây dựng phần WHERE ---
//         const whereClauses = []; // Luôn khởi tạo là MẢNG
//         const params = [];       // Mảng cho các giá trị tham số '?'

//         // Thêm điều kiện lọc vào MẢNG whereClauses bằng push()
//         if (trangThai) {
//             whereClauses.push("ttb.tinhTrang = ?"); // Dùng push()
//             params.push(trangThai);
//         }
//         if (phongId === 'kho') { // Lọc thiết bị "trong kho"
//             whereClauses.push("ttb.phong_id IS NULL"); // Dùng push()
//         } else if (phongId) { // Lọc theo phòng cụ thể
//             whereClauses.push("ttb.phong_id = ?"); // Dùng push()
//             params.push(parseInt(phongId));
//         }
//         if (theLoaiId) { // Lọc theo thể loại
//             whereClauses.push("tb.theloai_id = ?"); // Dùng push()
//             params.push(parseInt(theLoaiId));
//         }
//         if (thietBiId) { // Lọc theo loại thiết bị cụ thể
//             whereClauses.push("ttb.thietbi_id = ?"); // Dùng push()
//             params.push(parseInt(thietBiId));
//         }

//         // Tạo chuỗi WHERE hoàn chỉnh từ mảng whereClauses
//         const whereString = whereClauses.length > 0
//             ? `WHERE ${whereClauses.join(" AND ")}` // Nối các điều kiện bằng AND
//             : ""; // Nếu không có filter thì chuỗi rỗng

//         // --- Query để đếm tổng số dòng ---
//         const countQuery = `
//             SELECT COUNT(ttb.id) AS total
//             FROM thongtinthietbi ttb
//             LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id ${whereString}
//         `;
//         // params cho count query giống với params cho data query (trừ limit/offset)
//         const [countResult] = await pool.query(countQuery, params);
//         const totalItems = countResult[0].total;
//         const totalPages = Math.ceil(totalItems / limit);
//         // --- Kết thúc query count ---

//         // --- Query chính để lấy dữ liệu trang hiện tại ---
//         const dataQuery = `
//             SELECT
//                 ttb.id, ttb.tinhTrang, ttb.phong_id, ttb.nguoiDuocCap, ttb.ngayBaoHanhKetThuc,
//                 ttb.thietbi_id, ttb.phieunhap_id, ttb.ngayMua, ttb.giaTriBanDau,
//                 tb.tenThietBi AS tenLoaiThietBi, tb.theloai_id, tb.tonKho,
//                 tl.theLoai AS tenTheLoai,
//                 p.toa, p.tang, p.soPhong,
//                 pn.ngayTao AS ngayNhapKho, pn.truongHopNhap,
//                 u.hoTen AS tenNguoiCap,
//                 TIMESTAMPDIFF(DAY, CURDATE(), ttb.ngayBaoHanhKetThuc) AS ngayBaoHanhConLaiRaw,
//                 TIMESTAMPDIFF(MONTH, COALESCE(ttb.ngayMua, pn.ngayTao), CURDATE()) AS tuoiThoThang
//             FROM thongtinthietbi ttb
//             LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id
//             LEFT JOIN theloai tl ON tb.theloai_id = tl.id
//             LEFT JOIN phong p ON ttb.phong_id = p.id
//             LEFT JOIN phieunhap pn ON ttb.phieunhap_id = pn.id
//             LEFT JOIN users u ON ttb.nguoiDuocCap = u.id
//             ${whereString} /* Áp dụng điều kiện lọc */
//             ORDER BY ttb.id DESC /* Sắp xếp mặc định */
//             LIMIT ? OFFSET ?      /* Phân trang */
//         `;

//         // Thêm limit và offset vào cuối mảng params cho query chính
//         const paramsWithPagination = [...params, limit, offset];
//         const [rows] = await pool.query(dataQuery, paramsWithPagination);
//         // --- Kết thúc query chính ---


//         // Xử lý thêm tên phòng đầy đủ
//         const finalData = rows.map(item => ({
//             ...item,
//             // Nếu không có tòa nhà (phong_id là NULL), hiển thị 'Trong Kho'
//             phong_name: item.toa ? `${item.toa}${item.tang}.${item.soPhong}` : 'Trong Kho'
//         }));

//         // --- Trả về response ---
//         res.json({
//             data: finalData, // Dữ liệu của trang hiện tại
//             pagination: {
//                 currentPage: page,
//                 limit: limit,
//                 totalItems: totalItems,
//                 totalPages: totalPages
//             }
//         });
//         // --- Kết thúc trả về response ---

//     } catch (error) {
//         console.error("Lỗi khi lấy danh sách tài sản chi tiết:", error); // Log lỗi ra console backend
//         res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách tài sản." });
//     }
// };

// Lấy danh sách TẤT CẢ tài sản chi tiết (cho trang Quản lý Tài sản)
exports.getAllTaiSanChiTiet = async (req, res) => {
    try {
        // Lấy tham số filter và pagination từ query string
        const { trangThai, phongId, theLoaiId, thietBiId /*, sortBy, order */ } = req.query;
        const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
        const limit = parseInt(req.query.limit) || 14; // Số dòng/trang, mặc định là 14
        const offset = (page - 1) * limit; // Tính offset cho SQL

        // --- Xây dựng phần WHERE cho cả query chính và query count ---
        let whereClause = " WHERE 1=1 ";
        const params = [];

        if (trangThai) {
            whereClause += " AND ttb.tinhTrang = ?";
            params.push(trangThai);
        }
        if (phongId === 'kho' || phongId === 'null' || phongId === '') {
            whereClause += " AND ttb.phong_id IS NULL";
        } else if (phongId) {
            const parsedPhongId = parseInt(phongId);
            if (!isNaN(parsedPhongId)) {
                whereClause += " AND ttb.phong_id = ?";
                params.push(parsedPhongId);
            } else {
                return res.status(400).json({ error: `Giá trị phongId không hợp lệ: ${phongId}` });
            }
        }
        if (theLoaiId) {
            // Cần JOIN với thietbi (tb) để lọc theo theLoaiId
            whereClause += " AND tb.theloai_id = ?";
            params.push(parseInt(theLoaiId));
        }
        if (thietBiId) {
            whereClause += " AND ttb.thietbi_id = ?";
            params.push(parseInt(thietBiId));
        }
        // --- Kết thúc xây dựng WHERE ---


        // --- Query để đếm tổng số dòng ---
        const countQuery = `
            SELECT COUNT(ttb.id) AS total
            FROM thongtinthietbi ttb
            LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id
            ${whereClause}
        `;
        const [countResult] = await pool.query(countQuery, params);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        // --- Kết thúc query count ---

        // --- Query chính để lấy dữ liệu trang hiện tại ---
        let query = `
            SELECT
                ttb.id, ttb.tinhTrang, ttb.phong_id, ttb.nguoiDuocCap, 
                ttb.ngayBaoHanhKetThuc, 
                ttb.ngayDuKienTra,
                ttb.thietbi_id, ttb.phieunhap_id, ttb.ngayMua, ttb.giaTriBanDau, 
                tb.tenThietBi AS tenLoaiThietBi,
                tb.theloai_id, tb.tonKho,
                tl.theLoai AS tenTheLoai,
                p.toa, p.tang, p.soPhong,
                pn.ngayTao AS ngayNhapKho,
                pn.truongHopNhap,
                u.hoTen AS tenNguoiCap,
                CASE
                    WHEN ttb.tinhTrang = 'het_bao_hanh' THEN 0
                    WHEN ttb.ngayBaoHanhKetThuc IS NULL THEN NULL
                    ELSE DATEDIFF(ttb.ngayBaoHanhKetThuc, CURDATE())
                END AS ngayBaoHanhConLaiRaw,
                TIMESTAMPDIFF(MONTH, pn.ngayTao, CURDATE()) AS tuoiThoThang
            FROM thongtinthietbi ttb
            LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            LEFT JOIN phong p ON ttb.phong_id = p.id
            LEFT JOIN phieunhap pn ON ttb.phieunhap_id = pn.id
            LEFT JOIN users u ON ttb.nguoiDuocCap = u.id
            ${whereClause} -- Áp dụng điều kiện lọc
            ORDER BY ttb.id DESC -- Sắp xếp
            LIMIT ? OFFSET ? -- Thêm LIMIT và OFFSET
        `;
        const paramsWithPagination = [...params, limit, offset];
        const [rows] = await pool.query(query, paramsWithPagination);

        // Xử lý thêm tên phòng đầy đủ
        const finalData = rows.map(item => ({
            ...item,
            phong_name: item.toa ? `${item.toa}${item.tang}.${item.soPhong}` : 'Chưa phân bổ' // Hoặc 'Kho'
        }));

        // --- Trả về response với dữ liệu và thông tin phân trang ---
        res.json({
            data: finalData, // Dữ liệu của trang hiện tại
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        });
        // --- Kết thúc trả về response ---

    } catch (error) {
        console.error("Lỗi khi lấy danh sách tài sản chi tiết:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách tài sản." });
    }
};


exports.updateTinhTrangTaiSan = async (req, res) => {
    const { id } = req.params;
    const { tinhTrang, ghiChu } = req.body;

    // --- Validation ---
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID thông tin thiết bị không hợp lệ." });
    }
    // Thêm 'san_sang', 'dang_su_dung', 'hong' vào validStates nếu chúng hợp lệ
    const validStates = ['san_sang', 'dang_su_dung', 'hong', 'con_bao_hanh', 'het_bao_hanh', 'dang_bao_hanh', 'cho_thanh_ly', 'da_thanh_ly', 'de_xuat_thanh_ly','da_bao_hanh'];
    if (!tinhTrang || !validStates.includes(tinhTrang)) {
        return res.status(400).json({ error: `Trạng thái '${tinhTrang}' không hợp lệ.` });
    }
    //--- Kết thúc validation ---

    try {
        // --- Kiểm tra trạng thái hiện tại ---
        const [currentRows] = await pool.query("SELECT tinhTrang FROM thongtinthietbi WHERE id = ?", [id]);
        if (currentRows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin thiết bị để cập nhật trạng thái." });
        }
        const currentStatus = currentRows[0].tinhTrang;

        let query = "UPDATE thongtinthietbi SET tinhTrang = ?";
        const params = [tinhTrang];
        if (currentStatus === 'dang_bao_hanh' && tinhTrang !== 'dang_bao_hanh') {
            query += ", ngayDuKienTra = NULL";
        }
        query += " WHERE id = ?";
        params.push(id);

        const [result] = await pool.query(query, params);

        // --- Kiểm tra affectedRows ---
        if (result.affectedRows === 0) {
             console.warn(`[updateTinhTrangTaiSan] ID: ${id}, Update failed (affectedRows = 0).`);
        }
        console.log(`[updateTinhTrangTaiSan] ID: ${id}, Update successful. Sending response.`);
        res.status(200).json({ message: `Cập nhật trạng thái thiết bị ${id} thành công.` });

    } catch (error) {
        console.error(`[updateTinhTrangTaiSan] ID: ${id}, ERROR:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi cập nhật trạng thái thiết bị." });
    }
};

// Phân bổ thiết bị vào phòng (Cập nhật phong_id trong thongtinthietbi)
exports.phanBoTaiSanVaoPhong = async (req, res) => {
    const thongTinThietBiId = parseInt(req.params.id, 10);
    const { phong_id } = req.body;

    if (isNaN(thongTinThietBiId)) {
        return res.status(400).json({ error: "ID thông tin thiết bị không hợp lệ trong URL." });
    }
    if (!phong_id || isNaN(parseInt(phong_id, 10))) {
        return res.status(400).json({ error: "ID phòng không hợp lệ hoặc bị thiếu trong body." });
    }
    const phongIdInt = parseInt(phong_id, 10);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT phong_id FROM thongtinthietbi WHERE id = ? FOR UPDATE', [thongTinThietBiId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: `Không tìm thấy tài sản với ID ${thongTinThietBiId}.` });
        }
        const currentTaiSan = rows[0];

        if (currentTaiSan.phong_id !== null) {
            await connection.rollback();
            return res.status(400).json({ error: `Tài sản ID ${thongTinThietBiId} đã được gán cho phòng khác rồi.` });
        }

        const [updateResult] = await connection.query(
            'UPDATE thongtinthietbi SET phong_id = ? WHERE id = ?',
            [phongIdInt, thongTinThietBiId]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            throw new Error(`Không thể cập nhật phân bổ cho tài sản ID ${thongTinThietBiId}.`);
        }

        await connection.commit();
        res.status(200).json({ message: `Đã phân bổ tài sản ID ${thongTinThietBiId} vào phòng ID ${phongIdInt} thành công.` });

    } catch (error) {
        await connection.rollback();
        console.error("Lỗi server khi phân bổ tài sản:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
    } finally {
        if (connection) connection.release();
    }
};
