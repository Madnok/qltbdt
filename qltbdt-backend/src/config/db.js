// const mysql = require("mysql2/promise");

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "123456",
//   database: "qltbdt",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = db;

// src/config/db.js

const mysql = require('mysql2/promise');
require('dotenv').config(); // Đọc file .env cho môi trường local

const pool = mysql.createPool({
    host: process.env.DB_HOST, // Đọc từ biến môi trường
    user: process.env.DB_USER, // Đọc từ biến môi trường
    password: process.env.DB_PASSWORD, // Đọc từ biến môi trường
    database: process.env.DB_NAME, // Đọc từ biến môi trường
    port: process.env.DB_PORT || 3306, // Đọc từ biến môi trường hoặc dùng port mặc định 3306
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Đọc cấu hình SSL từ biến môi trường (quan trọng cho RDS)
    ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : undefined
});

module.exports = pool;