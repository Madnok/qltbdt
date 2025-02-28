const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, username, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang FROM users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy thông tin chi tiết người dùng theo ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT id, username, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang FROM users WHERE id = ?", [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thêm mới người dùng
exports.createUser = async (req, res) => {
    const { username, password, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang } = req.body;

    if (!username || !password || !hoTen) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin bắt buộc" });
    }

    try {
        await pool.query(
            "INSERT INTO users (username, password, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [username, password, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role || 'nguoidung', tinhTrang || 'on']
        );
        res.status(201).json({ message: "Thêm người dùng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang } = req.body;
    try {
        await pool.query(
            "UPDATE users SET hoTen = ?, ngaySinh = ?, gioiTinh = ?, sDT = ?, email = ?, hinhAnh = ?, role = ?, tinhTrang = ? WHERE id = ?",
            [hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang, id]
        );
        res.json({ message: "Cập nhật người dùng thành công!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy người dùng để xóa" });
        }
        
        res.json({ message: `Xóa người dùng ID ${id} thành công!` });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa người dùng" });
    }
};

//Upload avatar và cập nhật MySQL
exports.uploadAvatar = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: "Vui lòng chọn ảnh!" });
    }

    const avatarURL = req.file.path; // Lấy URL ảnh từ Cloudinary

    try {
        await pool.query("UPDATE users SET hinhAnh = ? WHERE id = ?", [avatarURL, id]);
        res.json({ message: "Cập nhật avatar thành công!", avatar: avatarURL });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật avatar!" });
    }
};