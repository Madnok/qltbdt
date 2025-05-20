const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcryptjs");
const { sendEmail } = require('../email');
const { emitToUser } = require('../socket');

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        // 1. Lấy tham số phân trang và tìm kiếm từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.search || '';
        const offset = (page - 1) * limit;

        // 2. Xây dựng query đếm tổng số lượng
        let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
        const countParams = [];
        if (searchTerm) {
            countQuery += ' AND (username LIKE ? OR hoTen LIKE ? OR email LIKE ?)';
            countParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
        // Bỏ .promise() vì pool đã hỗ trợ promise
        const [totalResult] = await pool.query(countQuery, countParams);
        const totalUsers = totalResult[0].count;
        const totalPages = Math.ceil(totalUsers / limit);

        // 3. Xây dựng query lấy dữ liệu trang hiện tại
        let query = 'SELECT id, username, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang FROM users WHERE 1=1';
        const queryParams = [];
        if (searchTerm) {
            query += ' AND (username LIKE ? OR hoTen LIKE ? OR email LIKE ?)';
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Bỏ .promise()
        const [users] = await pool.query(query, queryParams);

        // 4. Trả về cấu trúc JSON chuẩn lồng nhau
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { // <<< Quan trọng: Dữ liệu lồng trong 'data'
                users: users,
                totalPages: totalPages,
                currentPage: page
            }
        });

    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
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
        const { username, password, hoTen, ngaySinh = null, gioiTinh = "Khác", sDT, email, role, tinhTrang = "on" } = req.body;

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
        // Gửi email thông báo
        const subject = "Chào mừng bạn đến với Ứng dụng Quản lý Thiết bị!";
        const html = `
            <p>Xin chào ${hoTen},</p>
            <p>Tài khoản của bạn đã được tạo thành công.</p>
            <p>Tên đăng nhập: ${username}</p>
            <p>Mật khẩu: ${password} </p>
            <p>Vui lòng đăng nhập và đổi mật khẩu của bạn.</p>
        `;
        sendEmail(email, subject, html);

    } catch (error) {
        console.error("Lỗi khi thêm người dùng:", error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau!", error: error.message });
    }
};

// Cập nhật thông tin người dùng
// Cập nhật updateUser để nhận sDT và không nhận role
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    // Nhận các trường cho phép user tự cập nhật
    const { hoTen, email, ngaySinh, gioiTinh, sDT } = req.body; // <<< Thêm sDT, bỏ role
    const formattedNgaySinh = ngaySinh ? new Date(ngaySinh).toISOString().split("T")[0] : null;

    // Kiểm tra email trùng lặp (nếu email được gửi và khác email hiện tại)
    // (Thêm logic kiểm tra email trùng nếu cần)

    try {
        // // Không cần kiểm tra role admin ở đây vì user chỉ sửa thông tin của chính họ
        // const [userCheck] = await pool.query("SELECT email FROM users WHERE id = ?", [id]);
        // // ... logic kiểm tra email trùng ...

        // Cập nhật thông tin người dùng
        const [result] = await pool.query(
            "UPDATE users SET hoTen = ?, email = ?, ngaySinh = ?, gioiTinh = ?, sDT = ? WHERE id = ?", // <<< Thêm sDT=?, bỏ role=?
            [hoTen, email, formattedNgaySinh, gioiTinh, sDT || null, id] // <<< Thêm sDT
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        // Lấy lại thông tin user đã cập nhật để trả về (không bao gồm password)
        const [updatedUser] = await pool.query("SELECT id, username, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang FROM users WHERE id = ?", [id]);

        res.json({ message: "Cập nhật thông tin thành công", user: updatedUser[0] });
    } catch (error) {
        console.error("Lỗi khi cập nhật người dùng:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật thông tin." });
    }
};

// HÀM MỚI: Cập nhật mật khẩu
exports.updatePassword = async (req, res) => {
    const userId = req.user.id; // Lấy ID từ token (đảm bảo middleware verifyToken đã chạy)
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Vui lòng nhập đủ thông tin." });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Mật khẩu mới không khớp." });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
    }


    try {
        // Lấy mật khẩu hiện tại từ DB
        const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }
        const storedPassword = rows[0].password;

        // So sánh mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, storedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu hiện tại không đúng." });
        }

        // Băm mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới vào DB
        await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

        res.json({ message: "Đổi mật khẩu thành công!" });

    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        res.status(500).json({ message: "Lỗi server khi đổi mật khẩu." });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const userIdToDelete = parseInt(id);

    if (userIdToDelete === 1) {
        return res.status(403).json({ message: 'Không thể xóa tài khoản Quản trị viên gốc.' });
    }

    try {
        emitToUser(userIdToDelete, 'user_deleted', { message: 'Tài khoản của bạn đã bị xóa bởi quản trị viên.' });

        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [userIdToDelete]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Không tìm thấy người dùng để xóa" });
        }

        res.json({ message: `Xóa người dùng ID ${userIdToDelete} thành công!` });
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
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userIdToKick = parseInt(id);

    // Validate status
    if (status !== 'on' && status !== 'off') {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
    }
    // Không cho thay đổi trạng thái của admin ID 1
    if (userIdToKick === 1) { // Chú ý parseInt
        return res.status(403).json({ message: 'Không thể thay đổi trạng thái của Quản trị viên gốc.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE users SET tinhTrang = ? WHERE id = ?',
            [status, userIdToKick]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        if (status === 'off') {
            // Gọi hàm emitToUser đã import
            emitToUser(userIdToKick, 'status_changed', {
                newStatus: 'off',
            });
        }

        res.json({ message: "Cập nhật tình trạng thành công!", tinhTrang: status }); // Trả về trạng thái mới
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái người dùng:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};