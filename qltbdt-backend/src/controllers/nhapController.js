const pool = require("../config/db");

// Lấy danh sách tất cả phiếu nhập
exports.getAllPhieuNhap = async (req, res) => { 
    try {
        const [rows] = await pool.query("SELECT * FROM phieunhap");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy chi tiết phiếu nhập theo ID
exports.getPhieuNhapById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT * FROM phieunhap WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};