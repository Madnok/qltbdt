const app = require("./app"); // Import app đã cấu hình
const db = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Kiểm tra kết nối DB trước khi chạy server
async function testDB() {
  try {
    await db.query("SELECT 1");
    console.log("✅ Kết nối MySQL thành công!");
    app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Lỗi kết nối DB:", err);
  }
}

testDB();
