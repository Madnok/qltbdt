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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());


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
