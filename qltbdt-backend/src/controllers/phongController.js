const pool = require("../config/db");

//  Lấy danh sách tất cả phòng
exports.getAllPhong = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM phong");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết phòng theo ID
exports.getPhongById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM phong WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng" });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//  Thêm phòng mới
exports.addPhong = async (req, res) => {
    const { coSo, toa, tang, soPhong, chucNang } = req.body;

    // Kiểm tra đầu vào
    if (!coSo || !toa || !tang || !soPhong || !chucNang) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO phong (coSo, toa, tang, soPhong, chucNang) VALUES (?, ?, ?, ?, ?)",
            [coSo, toa, tang, soPhong, chucNang]
        );

        res.status(201).json({ message: "Thêm phòng thành công!", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thông tin phòng
exports.updatePhong = async (req, res) => {
    const { id } = req.params;
    const { coSo, toa, tang, soPhong, chucNang } = req.body;

    try {
        const [result] = await pool.query(
            "UPDATE phong SET coSo = ?, toa = ?, tang = ?, soPhong = ?, chucNang = ? WHERE id = ?",
            [coSo, toa, tang, soPhong, chucNang, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng để cập nhật" });
        }

        res.json({ message: "Cập nhật phòng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//  Xóa phòng
exports.deletePhong = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM phong WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy phòng để xóa" });
        }

        res.json({ message: "Xóa phòng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
