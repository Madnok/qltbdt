const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 10, // Giới hạn mỗi IP chỉ được 10 request trong khoảng thời gian windowMs
    message: "Quá nhiều yêu cầu đăng nhập từ IP này, vui lòng thử lại sau 15 phút.",
    standardHeaders: true, // Trả về headers thông báo lỗi
    legacyHeaders: false, 
});

router.post("/register", authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// router.get("/me", verifyToken, (req, res) => {
//     res.json({ user: req.user });
// });
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
