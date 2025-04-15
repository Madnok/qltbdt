const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../email");
const crypto = require('crypto');

function generateResetToken() {
  return crypto.randomBytes(20).toString('hex');
}

// Đăng ký tài khoản
exports.register = async (req, res) => {
  try {
    const { username, password, hoTen } = req.body;
    if (!username || !password || !hoTen) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const [userCheck] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (userCheck.length > 0) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (username, password, hoTen) VALUES (?, ?, ?)", [username, hashedPassword, hoTen]);

    return res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi đăng ký:", error);
    return res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau!" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tài khoản/email và mật khẩu!" });
    }

    const [result] = await db.query(
      "SELECT * FROM users WHERE BINARY username = ? OR BINARY email = ?",
      [identifier, identifier]
    );

    if (result.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy tài khoản!" });
    }

    const user = result[0];


    if (user.tinhTrang === "off") {
      return res.status(403).json({ message: "Tài khoản của bạn đang bị khóa!" });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ Lỗi nghiêm trọng: JWT_SECRET chưa được định nghĩa trong file .env!");
      return res.status(500).json({ message: "Lỗi cấu hình máy chủ." });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "4h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log("✅ Đăng nhập thành công:", user.username);
    return res.json({
      user: { id: user.id, username: user.username, role: user.role, hinhAnh: user.hinhAnh, hoTen: user.hoTen },
      message: "Đăng nhập thành công!",
    });
  } catch (err) {
    console.error("❌ Lỗi Server khi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi máy chủ, không thể đăng nhập!" });
  }
};

// Hàm mới để lấy thông tin user đang đăng nhập
exports.getMe = async (req, res) => {
  // Middleware verifyToken đã chạy và gắn req.user = { id: userId, role: userRole }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Chưa xác thực hoặc token không hợp lệ." });
  }

  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT id, username, hoTen, ngaySinh, gioiTinh, sDT, email, hinhAnh, role, tinhTrang FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const user = rows[0];
    // Trả về đối tượng user đầy đủ thông tin
    res.json({ user });

  } catch (error) {
    console.error("Lỗi khi lấy thông tin /auth/me:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin người dùng." });
  }
};

// Đăng xuất
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Đăng xuất thành công!" });
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với email này." });
    }

    const resetToken = generateResetToken();
    const resetPasswordExpires = Date.now() + 3600000; // 1 giờ (milliseconds)

    await db.query(
      "UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?",
      [resetToken, new Date(resetPasswordExpires), user[0].id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = "Yêu cầu đặt lại mật khẩu";
    const html = `
      <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      <p>Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    `;

    sendEmail(email, subject, html);

    res.json({ message: "Một email chứa hướng dẫn đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn." });
  } catch (error) {
    console.error("Lỗi quên mật khẩu:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xử lý yêu cầu quên mật khẩu." });
  }
};

// Reset mật khẩu
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [user] = await db.query(
      "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpires > ?",
      [token, new Date()]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?",
      [hashedPassword, user[0].id]
    );

    res.json({ message: "Mật khẩu của bạn đã được đặt lại thành công." });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi đặt lại mật khẩu." });
  }
};