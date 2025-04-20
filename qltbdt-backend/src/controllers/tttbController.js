const pool = require("../config/db");
const { emitToUser } = require("../socket");

// Lấy danh sách tất cả thông tin thiết bị
exports.getAllThongTinThietBi = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM thongtinthietbi");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết tttb theo ID với đầy đủ thông tin join
exports.getThongTinThietBiById = async (req, res) => {
    const { id } = req.params; // Lấy ID của TTTB cần xem

    // Kiểm tra ID hợp lệ
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ error: "Mã Thông Tin Thiết Bị không hợp lệ." });
    }

    try {
        // Câu lệnh SQL với JOINs để lấy thông tin chi tiết
        const sql = `
            SELECT
                -- Thông tin chính từ TTTB
                tttb.id, tttb.tinhTrang, tttb.nguoiDuocCap,
                tttb.ngayBaoHanhKetThuc, tttb.ngayDuKienTra,
                tttb.ngayMua, tttb.giaTriBanDau,
                tttb.thietbi_id, tttb.phong_id, tttb.phieunhap_id,

                -- Thông tin từ bảng Phong (p)
                p.toa AS phong_toa, p.tang AS phong_tang, p.soPhong AS phong_soPhong,

                -- Thông tin từ bảng ThietBi (tb) - Loại Thiết Bị
                tb.tenThietBi, tb.moTa AS thietbi_moTa, tb.donGia AS thietbi_donGia,
                tb.theloai_id,

                -- Thông tin từ bảng TheLoai (tl)
                tl.theLoai AS theloai_ten,

                -- Thông tin từ bảng PhieuNhap (pn)
                pn.truongHopNhap AS phieunhap_truongHopNhap, pn.danhSachChungTu AS phieunhap_danhSachChungTu,
                pn.ngayTao AS phieunhap_ngayTao

            FROM thongtinthietbi tttb
            LEFT JOIN phong p ON tttb.phong_id = p.id
            LEFT JOIN thietbi tb ON tttb.thietbi_id = tb.id  -- INNER JOIN nếu thietbi_id luôn phải có
            LEFT JOIN theloai tl ON tb.theloai_id = tl.id
            LEFT JOIN phieunhap pn ON tttb.phieunhap_id = pn.id
            WHERE tttb.id = ?
        `;

        const [rows] = await pool.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin của thiết bị này (TTTB ID: " + id + ")" });
        }

        // Lấy dòng dữ liệu đầu tiên (và duy nhất)
        const rawData = rows[0];

        // Tái cấu trúc dữ liệu thành object JSON mong muốn cho frontend
        const formattedData = {
            // Các trường trực tiếp từ tttb
            id: rawData.id,
            tinhTrang: rawData.tinhTrang,
            nguoiDuocCap: rawData.nguoiDuocCap,
            ngayBaoHanhKetThuc: rawData.ngayBaoHanhKetThuc,
            ngayDuKienTra: rawData.ngayDuKienTra,
            ngayMua: rawData.ngayMua,           // Lấy từ tttb nếu có
            giaTriBanDau: rawData.giaTriBanDau, // Lấy từ tttb nếu có

            // Tính toán phong_name
            phong_name: rawData.phong_toa && rawData.phong_tang && rawData.phong_soPhong
                      ? `${rawData.phong_toa}${rawData.phong_tang}.${rawData.phong_soPhong}`
                      : (rawData.phong_id === null ? 'Trong Kho' : 'N/A'), 

            // Ngày nhập kho từ phiếu nhập
            ngayNhapKho: rawData.phieunhap_ngayTao,

            // Object lồng nhau cho Loại Thiết Bị
            thietBi: {
                id: rawData.thietbi_id,
                tenThietBi: rawData.tenThietBi,
                moTa: rawData.thietbi_moTa,
                donGia: rawData.thietbi_donGia,
                theLoai: {
                    id: rawData.theloai_id,
                    theLoai: rawData.theloai_ten
                }
            },

             // Object lồng nhau cho Phiếu Nhập 
             phieuNhap: rawData.phieunhap_id ? {
                id: rawData.phieunhap_id,
                truongHopNhap: rawData.phieunhap_truongHopNhap,
                danhSachChungTu: rawData.phieunhap_danhSachChungTu,
                ngayTao: rawData.phieunhap_ngayTao 
             } : null 
        };

        res.json(formattedData);

    } catch (error) {
        console.error("Lỗi khi lấy chi tiết TTTB:", error);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ: " + error.message });
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

exports.getTTTBByMaThietBi = async (req, res) => {
    const { maThietBi } = req.params; // Lấy ID loại thiết bị từ URL
    if (isNaN(parseInt(maThietBi))) {
         return res.status(400).json({ error: "Mã loại thiết bị không hợp lệ." });
    }
    try {
        // Query lấy TTTB theo thietbi_id, join thêm thông tin cần thiết
        const [rows] = await pool.query(
           `SELECT
                tttb.id, tttb.tinhTrang, tttb.phong_id, tttb.nguoiDuocCap,
                tttb.ngayBaoHanhKetThuc, tttb.ngayDuKienTra,
                tttb.thietbi_id, tttb.phieunhap_id, tttb.ngayMua, tttb.giaTriBanDau,
                p.toa, p.tang, p.soPhong, -- Lấy thông tin phòng
                pn.ngayTao AS ngayNhapKho -- Lấy ngày nhập từ phiếu nhập
            FROM thongtinthietbi tttb
            LEFT JOIN phong p ON tttb.phong_id = p.id
            LEFT JOIN phieunhap pn ON tttb.phieunhap_id = pn.id
            WHERE tttb.thietbi_id = ?
            ORDER BY tttb.id DESC`,
            [parseInt(maThietBi)]
         );

         // Xử lý thêm tên phòng đầy đủ nếu cần
         const finalData = rows.map(item => ({
            ...item,
            phong_name: item.toa && item.tang && item.soPhong
                ? `${item.toa}${item.tang}.${item.soPhong}`
                : (item.phong_id === null ? 'Trong Kho' : 'N/A'),
        }));
        

        res.json(finalData); // Trả về mảng các TTTB thuộc loại này
    } catch (error) {
        console.error("Lỗi lấy TTTB theo Mã Loại Thiết Bị:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy chi tiết thiết bị." });
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
    const validStates = ['san_sang', 'dang_su_dung', 'hong', 'con_bao_hanh', 'het_bao_hanh', 'dang_bao_hanh', 'cho_thanh_ly', 'da_thanh_ly', 'de_xuat_thanh_ly', 'da_bao_hanh'];
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

    if (isNaN(thongTinThietBiId)) return res.status(400).json({ error: "ID thông tin thiết bị không hợp lệ." });
    if (!phong_id || isNaN(parseInt(phong_id, 10))) return res.status(400).json({ error: "ID phòng không hợp lệ hoặc bị thiếu." });
    const phongIdInt = parseInt(phong_id, 10);


    let connection;
    try {
        const connection = await pool.getConnection();

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
        console.log(`[phanBoTaiSan] Committed transaction for TTTB ID ${thongTinThietBiId} to Phong ID ${phongIdInt}.`);

        res.status(200).json({ message: `Đã phân bổ tài sản ID ${thongTinThietBiId} vào phòng ID ${phongIdInt} thành công.` });
        console.log(`[phanBoTaiSan] Sent HTTP 200 OK for TTTB ID ${thongTinThietBiId}.`);

        setImmediate(async () => {
            let socketConnection = null;
            try {
                socketConnection = await pool.getConnection();

                // Lấy thông tin cần thiết
                const [deviceInfo] = await socketConnection.query("SELECT tb.tenThietBi FROM thietbi tb JOIN thongtinthietbi tttb ON tb.id = tttb.thietbi_id WHERE tttb.id = ?", [thongTinThietBiId]);
                const [roomInfo] = await socketConnection.query("SELECT CONCAT(toa, tang, '.', soPhong) as tenPhong FROM phong WHERE id = ?", [phongIdInt]);
                const [targetUsers] = await socketConnection.query(
                    "SELECT id FROM users WHERE tinhTrang = 'on'"
                );

                if (targetUsers.length > 0) {
                    const eventData = {
                        message: `Tài sản '${deviceInfo[0]?.tenThietBi || `ID ${thongTinThietBiId}`}' đã được phân bổ vào phòng '${roomInfo[0]?.tenPhong || `ID ${phongIdInt}`}'.`,
                        thongTinThietBiId: thongTinThietBiId,
                        phongId: phongIdInt,
                    };
                    const eventName = 'asset_assigned_to_room';
                    console.log(`[phanBoTaiSan - Socket Task] Triển khai '${eventName}' đến ${targetUsers.length} users qua emitToUser.`);

                    // Lặp và gửi tới từng user ID
                    for (const user of targetUsers) {
                        emitToUser(user.id, eventName, eventData); // Dùng hàm đã có từ socket.js
                    }
                } else {
                    console.log("[phanBoTaiSan - Socket Task] No target users found to notify.");
                }

            } catch (socketOrDbError) {
                console.error("[phanBoTaiSan - Socket Task] Error:", socketOrDbError);
            } finally {
                if (socketConnection) socketConnection.release();
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi server khi phân bổ tài sản:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ." });
        }
    } finally {
        if (connection) connection.release();
        console.log(`[phanBoTaiSan] Main connection released for TTTB ID ${thongTinThietBiId}.`);
    }
};
