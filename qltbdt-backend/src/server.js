require('dotenv').config();
const http = require('http');
const app = require('./app'); 
const { initializeSocket } = require('./socket'); 
const pool = require('./config/db'); 

const httpServer = http.createServer(app); 


initializeSocket(httpServer);


if (process.env.VERCEL) {
  module.exports = app;
  console.log("🚀 Running in Vercel environment - exporting app handler.");
  // pool.query('SELECT 1')
  //   .then(() => console.log("✅ DB connected (Vercel initial check)"))
  //   .catch(err => console.error("❌ DB connection failed (Vercel initial check):", err));

} else {
  const PORT = process.env.PORT || 5000; 

  // Chỉ chạy listen() khi ở local
  httpServer.listen(PORT, async () => {
    try {
      await pool.query('SELECT 1');
      console.log("✅ Kết nối MySQL thành công!");
      console.log(`🚀 Server đang chạy tại port: ${PORT}`);
    } catch (error) {
      console.error("❌ Lỗi kết nối DB:", error);
      process.exit(1);
    }
  });
}