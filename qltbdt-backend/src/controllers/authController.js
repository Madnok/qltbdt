const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tài khoản và mật khẩu!" });
    }

    // Truy vấn user từ database
    const [result] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (result.length === 0) {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
    }

    const user = result[0];

    // Kiểm tra tình trạng tài khoản
    if (user.tinhTrang === "off") {
      return res.status(403).json({ message: "Tài khoản của bạn đang bị khóa!" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
    }

    // Tạo token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("❌ Lỗi nghiêm trọng: JWT_SECRET chưa được định nghĩa trong file .env!");
        return res.status(500).json({ message: "Lỗi cấu hình máy chủ." });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "2h" }
    );

    // Gửi token qua HTTP-Only Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Chỉ đặt thành true nếu dùng HTTPS
    });

    console.log("✅ Đăng nhập thành công:", user.username);
    return res.json({
      user: { id: user.id, username: user.username, role: user.role, hinhAnh: user.hinhAnh, hoTen:user.hoTen },
      message: "Đăng nhập thành công!",
    });
  } catch (err) {
    console.error("❌ Lỗi Server:", err);
    res.status(500).json({ message: "Lỗi máy chủ!" });
  }
};



// Đăng xuất
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Đăng xuất thành công!" });
};