require('dotenv').config();
const http = require('http'); // Thêm http
const { Server } = require("socket.io"); // Thêm socket.io
const app = require('./app');
const pool = require('./config/db');
const { initializeSocket } = require('./socket'); // Import hàm khởi tạo socket (sẽ tạo ở bước sau)

const PORT = process.env.PORT || 5000;

// Tạo HTTP server từ Express app
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO server và gắn vào HTTP server
const io = new Server(httpServer, {
  cors: {
      origin: "http://localhost:3000", // Cho phép kết nối từ frontend React
      methods: ["GET", "POST", "PUT"],
      credentials: true
  }
});

// Khởi tạo các xử lý sự kiện Socket.IO
initializeSocket(io);
app.set('socketio', io);

// Kiểm tra kết nối DB trước khi chạy server
httpServer.listen(PORT, async () => {
  try {
      await pool.query('SELECT 1');
      console.log("✅ Kết nối MySQL thành công!");
      console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error);
  }
});