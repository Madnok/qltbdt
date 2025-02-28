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
  
      // Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu!" });
      }
  
      // Tạo token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallbackSecret',
        { expiresIn: "1h" }
      );
  
      // Gửi token qua HTTP-Only Cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // false trong development, true nếu dùng HTTPS
        // sameSite: "none",
        // maxAge: 3600000,
      });
  
      console.log("✅ Đăng nhập thành công:", user.username);
      return res.json({
        user: { id: user.id, username: user.username, role: user.role },
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