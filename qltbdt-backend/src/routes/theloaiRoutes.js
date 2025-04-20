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

// Lấy danh sách tất cả thể loại kèm số lượng thiết bị mỗi thể loại
router.get("/theloaicount", verifyToken, async (req, res) => {
    const db = await pool.getConnection();
    try {
        const sql = `
            SELECT tl.id, tl.theLoai, COUNT(tb.id) AS thietBiCount
            FROM theloai tl
            LEFT JOIN thietbi tb ON tl.id = tb.theloai_id
            GROUP BY tl.id, tl.theLoai
            ORDER BY tl.theLoai ASC;
        `;

        const [rows] = await db.query(sql);
        res.json(rows); // Trả về mảng [{ id, theLoai, thietBiCount }]
    } catch (error) {
        console.error("Lỗi getAllTheLoaiWithCount:", error);
        res.status(500).json({ error: "Lỗi máy chủ khi lấy thể loại và số lượng thiết bị." });
    } finally {
        db.release();
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
    const { theLoai } = req.body;

    if (!theLoai) {
        return res.status(400).json({ error: "Vui lòng nhập tên thể loại" });
    }

    try {
        await pool.query("INSERT INTO theloai (theLoai) VALUES (?)", [theLoai]);
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



module.exports = router;
