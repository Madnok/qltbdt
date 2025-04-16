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
  "https://iuhelpfacilitymanagement-5vd09qmoi-madnoks-projects.vercel.app",
  "http://localhost:3000",
];

const corsOptions = {
  origin: allowedOrigins,
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


app.use(express.json()); 
app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true })); 

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
