const { verifyToken } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Lấy danh sách thể loại
router.get("/", verifyToken,async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM theloai");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy chi tiết thể loại và danh sách thiết bị theo ID thể loại
router.get("/:id",verifyToken, async (req, res) => {
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
router.put("/:id", verifyToken, async (req, res) => {
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
router.post("/",verifyToken,  async (req, res) => {
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
router.delete("/:id",verifyToken,  async (req, res) => {
    const { id } = req.params;

    try {
        // Kiểm tra xem thể loại có thiết bị nào không
        const [checkThietBi] = await pool.query("SELECT * FROM thietbi WHERE theloai_id = ?", [id]);
        if (checkThietBi.length > 0) {
            return res.status(400).json({ error: "Không thể xóa thể loại vì có thiết bị liên quan" });
        }

        // Kiểm tra xem thể loại có tồn tại không
        const [result] = await pool.query("DELETE FROM theloai WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy thể loại để xóa" });
        }

        res.json({ message: `Xóa thể loại ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa thể loại" });
    }
});

router.get("/theloai/:id",verifyToken,  async (req, res) => {
    const db = await pool.getConnection();
    try {
        const { id } = req.params;

        // Lấy danh sách thiết bị theo thể loại
        const dsThietBi = await db.query(
            `SELECT tb.id, tb.tenThietBi, 
                    COALESCE(tt.soLuong, 0) - COALESCE(ptb.totalUsed, 0) AS tonKho
             FROM thietbi tb
             LEFT JOIN thongtinthietbi tt ON tb.id = tt.thietbi_id
             LEFT JOIN (
                SELECT thietbi_id, SUM(soLuong) AS totalUsed FROM phong_thietbi GROUP BY thietbi_id
             ) ptb ON tb.id = ptb.thietbi_id
             WHERE tb.theloai_id = ?`,
            [id]
        );

        res.json({ dsThietBi });
    } catch (error) {
        res.status(500).json({ error: "Lỗi tải danh sách thiết bị" });
    } finally {
        db.release();
    }
});

module.exports = router;
