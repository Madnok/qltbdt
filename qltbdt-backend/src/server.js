require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// ✅ Chỉ dùng số cổng, KHÔNG phải "http://localhost:5000"
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
initializeSocket(httpServer);

// Chạy server sau khi kiểm tra DB
httpServer.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log("✅ Kết nối MySQL thành công!");
    console.log(`🚀 Server đang chạy tại port: ${PORT}`);
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error);
    process.exit(1); // Dừng server nếu không kết nối được DB
  }
});
