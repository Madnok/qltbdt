const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

// Import routes
const authRoutes = require("./routes/authRoutes");
const phongRoutes = require("./routes/phongRoutes");
const thietbiRoutes = require("./routes/thietBiRoutes");
const tttbRoutes = require("./routes/tttbRoutes");
const theloaiRoutes = require("./routes/theloaiRoutes");
const userRoutes = require("./routes/userRoutes");
const nhapRoutes = require("./routes/nhapRoutes");
const baohongRoutes = require("./routes/baohongRoutes");
const lichTrucRoutes = require("./routes/lichtrucRoutes");
const baotriRoutes = require("./routes/baotriRoutes");
const phieuxuatRoutes = require("./routes/phieuxuatRoutes");

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser()); // Thêm dòng này để đọc cookies
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,  //Cho phép gửi cookies từ frontend
}));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/phong", phongRoutes);
app.use("/api/thietbi", thietbiRoutes);
app.use("/api/tttb", tttbRoutes);
app.use("/api/theloai", theloaiRoutes);
app.use("/api/user", userRoutes);  
app.use("/api/nhap", nhapRoutes);
app.use("/api/baohong", baohongRoutes);
app.use("/api/lichtruc", lichTrucRoutes);
app.use("/api/baotri", baotriRoutes);
app.use("/api/phieuxuat", phieuxuatRoutes);


module.exports = app;
