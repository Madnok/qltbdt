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

// Lấy danh sách thiết bị chưa phân bổ vào phòng
exports.getUnassignedThongTinThietBi = async (req, res) => {
    const { thietbi_id } = req.query;

    try {
        if (!thietbi_id) {
            return res.status(400).json({ error: "Thiếu ID thiết bị!" });
        }

        // Lọc thiết bị chưa được gán vào phòng (không có phong_id trong bảng phong_thietbi)
        const [rows] = await pool.query(
            `SELECT tttb.* 
             FROM thongtinthietbi tttb
             WHERE tttb.thietbi_id = ? 
             AND tttb.id NOT IN (SELECT thongtinthietbi_id FROM phong_thietbi)`,
            [thietbi_id]
        );

        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thiết bị chưa phân bổ:", error);
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
    const { phong_id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT tttb.id, tttb.thietbi_id, tttb.tenThietBi, tttb.nguoiDuocCap
            FROM thongtinthietbi tttb
            WHERE tttb.phong_id = ?
        `, [phong_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Thêm thiết bị vào phòng
exports.createThietBiCoSan = async (req, res) => {
    const { phongId } = req.params;
    const { thietBiIds } = req.body;

    if (!thietBiIds || thietBiIds.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ" });
    }

    try {
        const sql = "UPDATE thietbi SET phong_id = ? WHERE id IN (?)";
        await pool.query(sql, [phongId, thietBiIds]);

        res.json({ message: "Thêm thiết bị vào phòng thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server");
    }
};

exports.createThemThietBiVaoPhong = async (req, res) => {
    const { phong_id, thietbi_id, soLuong } = req.body;

    if (!phong_id || !thietbi_id || !soLuong) {
        return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    try {
        // Lấy tên thiết bị từ bảng thietbi
        const [thietbiRows] = await pool.query("SELECT tenThietBi FROM thietbi WHERE id = ?", [thietbi_id]);
        if (thietbiRows.length === 0) {
            return res.status(400).json({ message: "Thiết bị không tồn tại" });
        }

        const tenThietBi = thietbiRows[0].tenThietBi;

        // Kiểm tra xem thiết bị này đã có trong phòng chưa
        const [rows] = await pool.execute(
            "SELECT id, soLuong FROM thongtinthietbi WHERE thietbi_id = ? AND phong_id = ?",
            [thietbi_id, phong_id]
        );

        if (rows.length > 0) {
            // Nếu đã có thiết bị trong phòng, cập nhật số lượng
            await pool.execute(
                "UPDATE thongtinthietbi SET soLuong = soLuong + ? WHERE id = ?",
                [soLuong, rows[0].id]
            );
        } else {
            // Nếu chưa có, thêm mới vào bảng thongtinthietbi
            await pool.execute(
                "INSERT INTO thongtinthietbi (thietbi_id, phong_id, soLuong, tenThietBi) VALUES (?, ?, ?, ?)",
                [thietbi_id, phong_id, soLuong, tenThietBi]
            );
        }

        return res.json({ message: "Lưu thiết bị thành công" });
    } catch (error) {
        console.error("Lỗi khi lưu thiết bị:", error);
        return res.status(500).json({ message: "Lỗi server", error });
    }
};
// ===============================================================================================================//
// Lấy danh sách TẤT CẢ tài sản chi tiết (cho trang Quản lý Tài sản)
// exports.getAllTaiSanChiTiet = async (req, res) => {
//     try {
//         // Lấy tham số filter và pagination từ query string
//         const { trangThai, phongId, theLoaiId, thietBiId /*, sortBy, order */ } = req.query;
//         const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
//         const limit = parseInt(req.query.limit) || 14; // Số dòng/trang, mặc định là 14
//         const offset = (page - 1) * limit; // Tính offset cho SQL

//         // --- Xây dựng phần WHERE cho cả query chính và query count ---
//         let whereClauses = [];
//         const params = [];

//         if (trangThai) {
//             whereClauses += " AND ttb.tinhTrang = ?";
//             params.push(trangThai);
//         }
//         if (phongId === 'kho') {
//             whereClauses += " AND ttb.phong_id IS NULL";
//         } else if (phongId) {
//             whereClauses += " AND ttb.phong_id = ?";
//             params.push(parseInt(phongId));
//         }
//         if (theLoaiId) {
//             // Cần JOIN với thietbi (tb) để lọc theo theLoaiId
//             whereClauses += " AND tb.theloai_id = ?";
//             params.push(parseInt(theLoaiId));
//         }
//         if (thietBiId) {
//             whereClauses += " AND ttb.thietbi_id = ?";
//             params.push(parseInt(thietBiId));
//         }

//         const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
        
//         // --- Kết thúc xây dựng WHERE ---


//         // --- Query để đếm tổng số dòng ---
//         const countQuery = `
//             SELECT COUNT(ttb.id) AS total
//             FROM thongtinthietbi ttb
//             LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id ${whereString}
//         `;

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
//             ${whereString}
//             ORDER BY ttb.id DESC
//             LIMIT ? OFFSET ?
//         `;

//         const paramsWithPagination = [...params, limit, offset];
//         const [rows] = await pool.query(dataQuery, paramsWithPagination);

//         // --- Kết thúc query chính ---

//         // -- Thêm điều kiện lọc
//         if (trangThai) {
//             query += " AND ttb.tinhTrang = ?";
//             params.push(trangThai);
//         }
//         if (phongId === 'kho') { // Lọc thiết bị "trong kho" (chưa phân bổ)
//             query += " AND ttb.phong_id IS NULL";
//         } else if (phongId) {
//             query += " AND ttb.phong_id = ?";
//             params.push(parseInt(phongId));
//         }
//         if (theLoaiId) {
//             query += " AND tb.theloai_id = ?";
//             params.push(parseInt(theLoaiId));
//         }
//         if (thietBiId) {
//             query += " AND ttb.thietbi_id = ?";
//             params.push(parseInt(thietBiId));
//         }

//         // Thêm sắp xếp (Ví dụ: Mặc định theo ID giảm dần)
//         query += " ORDER BY ttb.id DESC";
//         // if (sortBy) {
//         //    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
//         //    // Cần kiểm tra sortBy có phải là cột hợp lệ không để tránh SQL Injection
//         //    const validSortColumns = ['id', 'ngayNhapKho', 'ngayBaoHanhKetThuc', 'tenLoaiThietBi'];
//         //    if (validSortColumns.includes(sortBy)) {
//         //        query += ` ORDER BY ${sortBy} ${orderDirection}`;
//         //    } else {
//         //        query += " ORDER BY ttb.id DESC"; // Mặc định
//         //    }
//         // } else {
//         //    query += " ORDER BY ttb.id DESC"; // Mặc định
//         // }

//         // Xử lý thêm tên phòng đầy đủ
//         const finalData = rows.map(item => ({
//             ...item,
//             phong_name: item.toa ? `${item.toa}${item.tang}.${item.soPhong}` : 'Trong Kho'
//         }));

//         // --- Trả về response với dữ liệu và thông tin phân trang ---
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
//         console.error("Lỗi khi lấy danh sách tài sản chi tiết:", error);
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
        if (phongId === 'kho') {
            whereClause += " AND ttb.phong_id IS NULL";
        } else if (phongId) {
            whereClause += " AND ttb.phong_id = ?";
            params.push(parseInt(phongId));
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
            LEFT JOIN thietbi tb ON ttb.thietbi_id = tb.id -- JOIN cần thiết cho filter theLoaiId
            ${whereClause}
        `;
        const [countResult] = await pool.query(countQuery, params);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        // --- Kết thúc query count ---

        // --- Query chính để lấy dữ liệu trang hiện tại ---
        let query = `
            SELECT
                ttb.id, ttb.tinhTrang, ttb.phong_id, ttb.nguoiDuocCap, ttb.ngayBaoHanhKetThuc, ttb.thietbi_id, ttb.phieunhap_id, ttb.ngayMua, ttb.giaTriBanDau, -- Liệt kê các cột cần từ ttb
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
            ORDER BY ttb.id DESC -- Sắp xếp (có thể thay đổi)
            LIMIT ? OFFSET ? -- Thêm LIMIT và OFFSET
        `;
        const paramsWithPagination = [...params, limit, offset]; // Thêm limit và offset vào params
        const [rows] = await pool.query(query, paramsWithPagination);
        // --- Kết thúc query chính ---

        // Thêm điều kiện lọc
        if (trangThai) {
            query += " AND ttb.tinhTrang = ?";
            params.push(trangThai);
        }
        if (phongId === 'kho') { // Lọc thiết bị "trong kho" (chưa phân bổ)
            query += " AND ttb.phong_id IS NULL";
        } else if (phongId) {
            query += " AND ttb.phong_id = ?";
            params.push(parseInt(phongId));
        }
        if (theLoaiId) {
            query += " AND tb.theloai_id = ?";
            params.push(parseInt(theLoaiId));
        }
        if (thietBiId) {
            query += " AND ttb.thietbi_id = ?";
            params.push(parseInt(thietBiId));
        }

        // Thêm sắp xếp (Ví dụ: Mặc định theo ID giảm dần)
        query += " ORDER BY ttb.id DESC";
        // if (sortBy) {
        //    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
        //    // Cần kiểm tra sortBy có phải là cột hợp lệ không để tránh SQL Injection
        //    const validSortColumns = ['id', 'ngayNhapKho', 'ngayBaoHanhKetThuc', 'tenLoaiThietBi'];
        //    if (validSortColumns.includes(sortBy)) {
        //        query += ` ORDER BY ${sortBy} ${orderDirection}`;
        //    } else {
        //        query += " ORDER BY ttb.id DESC"; // Mặc định
        //    }
        // } else {
        //    query += " ORDER BY ttb.id DESC"; // Mặc định
        // }

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

// API MỚI (hoặc sửa updateThongTinThietBi): Chỉ cập nhật trạng thái
exports.updateTinhTrangTaiSan = async (req, res) => {
    const { id } = req.params; // ID của thongtinthietbi
    const { tinhTrang, ghiChu } = req.body; // Trạng thái mới (vd: 'cho_thanh_ly') và ghi chú (tùy chọn)

    // --- Validation ---
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: "ID thông tin thiết bị không hợp lệ." });
    }
    // Có thể thêm kiểm tra giá trị tinhTrang hợp lệ
    const validStates = ['con_bao_hanh', 'het_bao_hanh', 'dang_bao_hanh', 'cho_thanh_ly', 'da_thanh_ly'];
    if (!tinhTrang || !validStates.includes(tinhTrang)) {
        return res.status(400).json({ error: `Trạng thái '${tinhTrang}' không hợp lệ.` });
    }
    // --- Kết thúc Validation ---

    try {
        // Chỉ cập nhật cột tinhTrang và có thể thêm ghi chú vào đâu đó nếu cần
        const [result] = await pool.query(
            "UPDATE thongtinthietbi SET tinhTrang = ? WHERE id = ?",
            [tinhTrang, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin thiết bị để cập nhật trạng thái." });
        }

        res.json({ message: `Cập nhật trạng thái thiết bị ID <span class="math-inline">\{id\} thành '</span>{tinhTrang}' thành công!` });
    } catch (error) {
        console.error(`Lỗi khi cập nhật trạng thái thiết bị ${id}:`, error);
        res.status(500).json({ error: "Lỗi máy chủ khi cập nhật trạng thái thiết bị." });
    }
};

// Phân bổ thiết bị vào phòng (Cập nhật phong_id trong thongtinthietbi)
// Hoặc bạn có thể dùng API của phongController: addThietBiToPhong nếu logic phù hợp hơn
exports.assignTaiSanToPhong = async (req, res) => {
    const { thongtinthietbi_id } = req.params; // ID của TTTB cần gán
    const { phong_id } = req.body; // ID của phòng muốn gán vào

    if (!thongtinthietbi_id || isNaN(parseInt(thongtinthietbi_id))) {
        return res.status(400).json({ error: "ID thông tin thiết bị không hợp lệ." });
    }
    if (phong_id === undefined || phong_id === null || isNaN(parseInt(phong_id))) {
        // Nếu muốn gỡ khỏi phòng (đưa về kho), có thể cho phép phong_id là null
        return res.status(400).json({ error: "ID phòng không hợp lệ." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Kiểm tra xem TTTB có tồn tại và chưa được gán không?
        const [deviceRows] = await connection.query("SELECT phong_id, thietbi_id FROM thongtinthietbi WHERE id = ?", [thongtinthietbi_id]);
        if (deviceRows.length === 0) {
            throw new Error(`Thông tin thiết bị ID ${thongtinthietbi_id} không tồn tại.`);
        }
        if (deviceRows[0].phong_id !== null) {

            throw new Error(`Thiết bị ID ${thongtinthietbi_id} đã được phân bổ vào phòng ID ${deviceRows[0].phong_id}.`);
        }
        const thietbi_id = deviceRows[0].thietbi_id; // Lấy thietbi_id để dùng cho bảng phong_thietbi

        // 2. (Quan trọng) Thêm vào bảng phong_thietbi để thể hiện mối quan hệ
        await connection.query(
            "INSERT IGNORE INTO phong_thietbi (phong_id, thietbi_id, thongtinthietbi_id) VALUES (?, ?, ?)",
            [phong_id, thietbi_id, thongtinthietbi_id]
        );

        // 3. Cập nhật lại phong_id trong thongtinthietbi (tuỳ chọn, nhưng nên làm để dễ truy vấn)
        await connection.query(
            "UPDATE thongtinthietbi SET phong_id = ? WHERE id = ?",
            [phong_id, thongtinthietbi_id]
        );

        await connection.commit();
        res.json({ message: `Phân bổ thiết bị ID ${thongtinthietbi_id} vào phòng ID ${phong_id} thành công!` });

    } catch (error) {
        await connection.rollback();
        console.error(`Lỗi khi phân bổ thiết bị ${thongtinthietbi_id}:`, error);
        res.status(500).json({ error: `Lỗi máy chủ khi phân bổ thiết bị: ${error.message}` });
    } finally {
        connection.release();
    }
};
