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
        const [rows] = await pool.query("SELECT id, tenThietBi FROM thietbi");
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
    const { thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang } = req.body;

    if (!thietbi_id) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin thiết bị" });
    }

    try {
        // Lấy tên thiết bị từ bảng thietbi
        const [thietbiRows] = await pool.query("SELECT tenThietBi FROM thietbi WHERE id = ?", [thietbi_id]);
        if (thietbiRows.length === 0) {
            return res.status(400).json({ error: "Thiết bị không tồn tại" });
        }

        const tenThietBi = thietbiRows[0].tenThietBi;

        // Thêm vào bảng thongtinthietbi
        await pool.query(
            "INSERT INTO thongtinthietbi (thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang, tenThietBi) VALUES (?, ?, ?, ?, ?, ?)",
            [thietbi_id, phong_id || null, nguoiDuocCap || null, phieunhap_id, tinhTrang || 'chua_dung', tenThietBi]
        );

        res.status(201).json({ message: "Thêm thông tin thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm mới nhiều thông tin thiết bị
exports.createMultipleThongTinThietBi = async (req, res) => {
    const { danhSachThietBi } = req.body; // Nhận danh sách thiết bị từ client

    if (!Array.isArray(danhSachThietBi) || danhSachThietBi.length === 0) {
        return res.status(400).json({ error: "Danh sách thiết bị không hợp lệ" });
    }

    try {
        const values = danhSachThietBi.map(tb => [
            tb.thietbi_id,
            tb.phong_id || null,
            tb.nguoiDuocCap || null,
            tb.phieunhap_id,
            tb.tinhTrang || 'chua_dung',
            tb.tenThietBi
        ]);

        await pool.query(
            "INSERT INTO thongtinthietbi (thietbi_id, phong_id, nguoiDuocCap, phieunhap_id, tinhTrang, tenThietBi) VALUES ?",
            [values]
        );

        res.status(201).json({ message: "Thêm nhiều thiết bị thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Xóa thông tin thiết bị
exports.deleteThongTinThietBi = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM thongtinthietbi WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thông tin thiết bị để xóa" });
        }
        res.json({ message: `Xóa thông tin thiết bị ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa thông tin thiết bị" });
    }
};
