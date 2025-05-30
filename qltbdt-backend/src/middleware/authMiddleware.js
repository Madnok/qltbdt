const jwt = require("jsonwebtoken");

const db = require("../config/db");

exports.verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Không có token, truy cập bị từ chối!" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");

    // Truy vấn database để lấy thông tin user đầy đủ
    const [userData] = await db.query("SELECT id, username, hoTen, hinhAnh, role FROM users WHERE id = ?", [decoded.id]);
    if (userData.length === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    req.user = userData[0]; // Gán user đầy đủ vào req.user
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ!" });
  }
};

exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Đảm bảo verifyToken đã chạy và gắn req.user
    if (!req.user || !req.user.role) {
       return res.status(401).json({ message: "Người dùng chưa được xác thực hoặc không có vai trò." });
    }

    // Kiểm tra xem vai trò của người dùng có nằm trong danh sách được phép không
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này!" });
    }
    next();
  };
};


