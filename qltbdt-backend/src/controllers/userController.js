const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcryptjs");

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
    try {
        const { username, password, hoTen, ngaySinh = null, gioiTinh = "Khác", sDT, email, role, tinhTrang = "on"} = req.body;

        if (!username || !password || !hoTen || !email) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin bắt buộc" });
        }

        // Kiểm tra username có bị trùng không
        const [userCheck] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
        if (userCheck.length > 0) {
            return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
        }

        // Kiểm tra email có bị trùng không 
        const [emailCheck] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (emailCheck.length > 0) {
            return res.status(400).json({ message: "Email đã được sử dụng!" });
        }

        // Băm mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Thêm người dùng vào database
        const [result] = await pool.query(
            "INSERT INTO users (username, password, hoTen, ngaySinh, gioiTinh, sDT, email, role, tinhTrang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [username, hashedPassword, hoTen, ngaySinh || null, gioiTinh, sDT || null, email, role || 'nguoidung', tinhTrang]
        );

        res.status(201).json({ message: "Thêm người dùng thành công!", userId: result.insertId });

    } catch (error) {
        console.error("Lỗi khi thêm người dùng:", error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau!", error: error.message });
    }
};
// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { hoTen, email, role, ngaySinh, gioiTinh } = req.body;
    const formattedNgaySinh = ngaySinh ? ngaySinh.split("T")[0] : null;

    try {
        // Kiểm tra nếu user là admin thì không cho phép cập nhật
        const [user] = await pool.query("SELECT role FROM users WHERE id = ?", [id]);
        if (user[0].role === "admin") {
            return res.status(403).json({ error: "Không thể chỉnh sửa tài khoản Admin." });
        }

        // Cập nhật thông tin người dùng
        await pool.query(
            "UPDATE users SET hoTen = ?, email = ?, ngaySinh = ?,gioiTinh = ? , role = ? WHERE id = ?",
            [hoTen, email, formattedNgaySinh, gioiTinh, role, id]
        );
        res.json({ message: "Cập nhật người dùng thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật người dùng:", error);
        res.status(500).json({ message: "Lỗi server" });
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

    const avatarURL = req.file.path;
    try {
        await pool.query("UPDATE users SET hinhAnh = ? WHERE id = ?", [avatarURL, id]);
        res.json({ message: "Cập nhật avatar thành công!", avatar: avatarURL });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật avatar!" });
    }
};

// Cập nhật tình trạng người dùng (ON/OFF)
exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy tình trạng hiện tại
        const [rows] = await pool.query("SELECT tinhTrang FROM users WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        // Chuyển đổi trạng thái
        const newStatus = rows[0].tinhTrang === "on" ? "off" : "on";

        // Cập nhật trạng thái mới vào DB
        await pool.query("UPDATE users SET tinhTrang = ? WHERE id = ?", [newStatus, id]);
        res.json({ message: "Cập nhật tình trạng thành công!", newStatus });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật tình trạng!" });
    }
};