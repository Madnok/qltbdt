const pool = require("../config/db");

// Lấy danh sách thiết bị có phân trang, lọc và thông tin liên quan
exports.getAllThietBi = async (req, res) => {
    try {
        // 1. Lấy tham số từ query string (với giá trị mặc định)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { theloai_id, search } = req.query; // Lấy theloai_id và search từ query

        // 2. Xây dựng mệnh đề WHERE và tham số một cách động
        let whereClauses = [];
        let params = [];         // Tham số cho query chính (lấy dữ liệu)
        let countParams = [];    // Tham số riêng cho query đếm tổng số bản ghi

        if (theloai_id && theloai_id !== '') {
            whereClauses.push("tb.theloai_id = ?");
            params.push(theloai_id);
            countParams.push(theloai_id);
        }
        if (search && search !== '') {
            // Tìm kiếm gần đúng trong tenThietBi hoặc moTa
            whereClauses.push("(tb.tenThietBi LIKE ? OR tb.moTa LIKE ?)");
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 3. Query đếm tổng số bản ghi khớp với điều kiện lọc (cho phân trang)
        const countSql = `SELECT COUNT(tb.id) as totalItems FROM thietbi tb ${whereString}`;
        // console.log("Count SQL:", countSql, countParams); 
        const [countResult] = await pool.query(countSql, countParams);
        const totalItems = countResult[0].totalItems;
        const totalPages = Math.ceil(totalItems / limit);

        // 4. Query chính để lấy dữ liệu thiết bị với các thông tin cần thiết
        const sql = `
            SELECT
                tb.id,
                tb.theloai_id,
                tb.tenThietBi,
                tb.moTa,
                tb.donGia,
                tb.tonKho,
                tl.theLoai AS tenTheLoai, 
                (
                    SELECT COUNT(*)
                    FROM thongtinthietbi tttb
                    WHERE tttb.thietbi_id = tb.id
                ) AS soLuongChiTiet 
            FROM
                thietbi tb
            LEFT JOIN
                theloai tl ON tb.theloai_id = tl.id -- Join với bảng theloai để lấy tên
            ${whereString} -- Áp dụng điều kiện lọc
            ORDER BY tb.id DESC -- Sắp xếp (có thể thay đổi)
            LIMIT ? OFFSET ? -- Áp dụng phân trang
        `;
        const queryParams = [...params, limit, offset]; // Thêm limit và offset vào cuối mảng tham số
        // console.log("Main SQL:", sql, queryParams); // Debug

        const [rows] = await pool.query(sql, queryParams);

        // 5. Định dạng lại dữ liệu a theloai cho giống cấu trúc include của Sequelize
        const formattedRows = rows.map(row => ({
            ...row,
            theloai: row.tenTheLoai ? { id: row.theloai_id, theLoai: row.tenTheLoai } : null 
        }));


        // 6. Trả về kết quả theo cấu trúc mong đợi của frontend
        res.json({
            data: {
                rows: formattedRows, 
                count: totalItems    
            },
            pagination: {
                page: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages,
            },
        });

    } catch (error) {
        console.error("Error fetching thietbi:", error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách thiết bị', error: error.message });
    }
};

// Lấy tổng số lượng nhập cho từng thiết bị
exports.getAllThietBiFromPhieuNhap = async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT thietbi.id, thietbi.tenThietBi, SUM(thongtinthietbi.soLuong) AS tongSoLuongNhap
            FROM thietbi
            JOIN thongtinthietbi ON thietbi.id = thongtinthietbi.thietbi_id
            GROUP BY thietbi.id, thietbi.tenThietBi
        `);
        res.status(200).json(results);
    } catch (error) {
        console.error("Lỗi khi lấy tổng số lượng nhập:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};


//  Lấy chi tiết thiết bị theo ID lấy cả tên thể loại và id thể loại
exports.getThietBiById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT tb.*, tl.theLoai 
            FROM thietbi tb
            JOIN theloai tl ON tb.theloai_id = tl.id
            WHERE tb.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thiết bị" });
        }

        res.json(rows[0]); // Trả về thiết bị kèm tên thể loại
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Thêm mới thiết bị
exports.createThietBi = async (req, res) => {
    const { theloai_id, tenThietBi, moTa, donGia, tonKho } = req.body;

    if (!theloai_id || !tenThietBi || !donGia) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin thiết bị" });
    }

    try {
        await pool.query(
            "INSERT INTO thietbi (theloai_id, tenThietBi, moTa, donGia, tonKho) VALUES (?, ?, ?, ?, ?)",
            [theloai_id, tenThietBi, moTa, donGia, tonKho]
        );
        res.status(201).json({ message: "Thêm thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thiết bị
exports.updateThietBi = async (req, res) => {
    const { id } = req.params;
    const { theloai_id, tenThietBi, moTa, donGia, tonKho } = req.body;

    try {
        await pool.query(
            "UPDATE thietbi SET theloai_id = ?, tenThietBi = ?, moTa = ?, donGia = ?, tonKho = ? WHERE id = ?",
            [theloai_id, tenThietBi, moTa, donGia, tonKho, id]
        );
        res.json({ message: "Cập nhật thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa thiết bị
exports.deleteThietBi = async (req, res) => {
    const { id } = req.params;

    try {
        // Kiểm tra thông tin thiết bị và tồn kho
        const [[checkCounts]] = await pool.query(
            `SELECT 
                COUNT(tt.id) AS thongTinThietBiCount,
                t.tonKho 
            FROM thietbi t
            LEFT JOIN thongtinthietbi tt ON t.id = tt.thietbi_id
            WHERE t.id = ?`,
            [id]
        );

        // Nếu thiết bị vẫn còn trong thông tin thiết bị hoặc tồn kho > 0, không cho phép xóa
        if (checkCounts.thongTinThietBiCount > 0 || checkCounts.tonKho > 0) {
            return res.status(400).json({
                error: "Không thể xóa thiết bị vì vẫn còn tồn kho hoặc thiết bị đang được sử dụng!"
            });
        }

        // Xóa thiết bị nếu điều kiện hợp lệ
        const [result] = await pool.query("DELETE FROM thietbi WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thiết bị để xóa" });
        }

        res.json({ message: `Xóa thiết bị ID ${id} thành công!` });
    } catch (error) {
        console.error("Lỗi khi xóa thiết bị:", error);
        res.status(500).json({ error: "Lỗi xóa thiết bị!" });
    }
};

// Lấy thông tin thiết bị, trừ đi số lượng đã gán vào phòng
exports.getThongTinThietBi = async (req, res) => {
    const { thietbi_id } = req.params;

    try {
        const [result] = await pool.query(
            `SELECT tttb.id AS thongtinthietbi_id, 
                    tb.id AS thietbi_id, 
                    tb.tenThietBi, 
                    (tb.tonKho - IFNULL(SUM(ptb.soLuong), 0)) AS tonKhoConLai
             FROM thongtinthietbi tttb
             JOIN thietbi tb ON tttb.thietbi_id = tb.id
             LEFT JOIN phong_thietbi ptb ON tb.id = ptb.thietbi_id
             WHERE tb.id = ?
             GROUP BY tb.id, tttb.id`,
            [thietbi_id]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin thiết bị!" });
        }

        res.json(result[0]);
    } catch (error) {
        console.error("Lỗi lấy thông tin thiết bị:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};

