const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Lấy danh sách thể loại
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM theloai");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy chi tiết thể loại và danh sách thiết bị theo ID thể loại
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [theLoai] = await pool.query("SELECT * FROM theloai WHERE id = ?", [id]);
        const [dsThietBi] = await pool.query("SELECT * FROM thietbi WHERE theloai_id = ?", [id]);
        
        res.json({ theLoai: theLoai[0], dsThietBi });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cập nhật thông tin thể loại
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { theLoai } = req.body;
    
    try {
        await pool.query("UPDATE theloai SET theLoai = ? WHERE id = ?", [theLoai, id]);
        res.json({ message: "Cập nhật thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// API Thêm thể loại
router.post("/", async (req, res) => {
    console.log("Request body từ frontend:", req.body); // Kiểm tra dữ liệu nhận được
    const { theLoai } = req.body;

    if (!theLoai) {
        return res.status(400).json({ error: "Vui lòng nhập tên thể loại" });
    }

    try {
        await pool.query("INSERT INTO theloai (theLoai) VALUES (?)", [theLoai]); // Kiểm tra tên bảng/cột đúng chưa
        res.status(201).json({ message: "Thêm thể loại thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// API Xóa Thể Loại
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM theloai WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thể loại để xóa" });
        }

        res.json({ message: `Xóa thể loại ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa thể loại" });
    }
});


module.exports = router;
