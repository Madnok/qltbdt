require('dotenv').config();
const http = require('http');
const app = require('./app'); // Import Express app
const { initializeSocket } = require('./socket');// Import hàm khởi tạo socket (sẽ tạo ở bước sau)
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Tạo HTTP server từ Express app
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO bằng hàm từ socket.js
const io = initializeSocket(httpServer);

// Kiểm tra kết nối DB trước khi chạy server
httpServer.listen(PORT, async () => {
  try {
      await pool.query('SELECT 1');
      console.log("✅ Kết nối MySQL thành công!");
      console.log(`🚀 Server chạy tại Port: ${PORT}`);
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error);
  }
});
