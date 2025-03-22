const pool = require("../config/db");

// Lấy danh sách tất cả thiết bị
exports.getAllThietBi = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM thietbi");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        // Kiểm tra xem thiết bị có liên quan trong `thongtinthietbi` không
        const [rows] = await pool.query("SELECT COUNT(*) AS count FROM thongtinthietbi WHERE thietbi_id = ?", [id]);
        if (rows[0].count > 0) {
            return res.status(400).json({ error: "Không thể xóa thiết bị vì đã được sử dụng trong thông tin thiết bị" });
        }

        // Nếu không có liên kết, xóa thiết bị
        const [result] = await pool.query("DELETE FROM thietbi WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thiết bị để xóa" });
        }

        res.json({ message: `Xóa thiết bị ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa thiết bị" });
    }
};

