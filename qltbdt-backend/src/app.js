const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import routes
const authRoutes = require("./routes/authRoutes");
const phongRoutes = require("./routes/phongRoutes");
const thietbiRoutes = require("./routes/thietBiRoutes");
const tttbRoutes = require("./routes/tttbRoutes");
const theloaiRoutes = require("./routes/theloaiRoutes");
const userRoutes = require("./routes/userRoutes");
const nhapRoutes = require("./routes/nhapRoutes");
const baohongRoutes = require("./routes/baohongRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Thêm dòng này để đọc cookies
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,  // Quan trọng! Cho phép gửi cookies từ frontend
}));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/phong", phongRoutes);
app.use("/api/thietbi", thietbiRoutes);
app.use("/api/tttb", tttbRoutes);
app.use("/api/theloai", theloaiRoutes);
app.use("/api/user", userRoutes);  
app.use("/api/nhap", nhapRoutes);
app.use("/api/baohong", baohongRoutes);

module.exports = app;
