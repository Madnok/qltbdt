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
    const {thietbi_id, phong_id, nguoiDuocCap, tinhTrang } = req.body;
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
            SELECT tttb.id, tttb.thietbi_id, tttb.tenThietBi, tttb.soLuong, tttb.nguoiDuocCap
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


