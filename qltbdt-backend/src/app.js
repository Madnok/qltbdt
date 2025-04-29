const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const anonymousIdMiddleware = require("./middleware/anonymousIdMiddleware")
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
const congviecRoutes = require("./routes/congviecRoutes");
const baotriRoutes = require("./routes/baotriRoutes");
const phieuxuatRoutes = require("./routes/phieuxuatRoutes");
const gopyRoutes = require("./routes/gopyRoutes");
const lichbaoduongRoutes = require("./routes/lichbaoduongRoutes");
const thongkeRoutes = require("./routes/thongkeRoutes");

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL 
];

const corsOptions = {
  // Chỉ cần function kiểm tra origin
  origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          console.error(`CORS Error (Express): Origin ${origin} not allowed.`);
          callback(new Error("Not allowed by CORS"));
      }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


app.use(helmet()); 
app.use(express.json());
app.use(cookieParser()); 
app.use(anonymousIdMiddleware);
app.use(express.urlencoded({ extended: true })); 


// routes
app.use("/api/auth", authRoutes);
app.use("/api/phong", phongRoutes);
app.use("/api/thietbi", thietbiRoutes);
app.use("/api/tttb", tttbRoutes);
app.use("/api/theloai", theloaiRoutes);
app.use("/api/user", userRoutes);  
app.use("/api/nhap", nhapRoutes);
app.use("/api/baohong", baohongRoutes);
app.use("/api/congviec", congviecRoutes);
app.use("/api/baotri", baotriRoutes);
app.use("/api/xuat", phieuxuatRoutes);
app.use("/api/gopy", gopyRoutes);
app.use("/api/lichbaoduong", lichbaoduongRoutes);
app.use("/api/thongke", thongkeRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend đang chạy',
    timestamp: new Date().toISOString()
  });
});


module.exports = app;
