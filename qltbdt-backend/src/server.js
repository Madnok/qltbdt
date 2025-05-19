require('dotenv').config();
const http = require('http');
const app = require('./app'); 
const { initializeSocket } = require('./socket'); 
const pool = require('./config/db'); 

const httpServer = http.createServer(app); 
const warrantyService = require('./services/warrantyService');

initializeSocket(httpServer);


if (process.env.VERCEL) {
  module.exports = app;
  console.log("🚀 Running in Vercel environment - exporting app handler.");
} else {
  const PORT = process.env.PORT || 5000; 

  // Chỉ chạy listen() khi ở local
  httpServer.listen(PORT, async () => {
    try {
      await pool.query('SELECT 1');
      console.log("✅ Kết nối MySQL thành công!");
      console.log(`🚀 Server đang chạy tại port: ${PORT}`);
      warrantyService.startWarrantyUpdateSchedule(); 
    } catch (error) {
      console.error("❌ Lỗi kết nối DB:", error);
      process.exit(1);
    }
  });
}