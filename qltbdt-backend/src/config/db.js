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


const mysql = require('mysql2/promise');
require('dotenv').config(); 
// Tạo connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Đọc host từ biến môi trường DB_HOST
    user: process.env.DB_USER,         // Đọc user từ biến môi trường DB_USER
    password: process.env.DB_PASSWORD, // Đọc password từ biến môi trường DB_PASSWORD
    database: process.env.DB_DATABASE, // Đọc tên database từ biến môi trường DB_DATABASE
    port: process.env.DB_PORT || 3306, // Đọc port từ biến môi trường DB_PORT, nếu không có thì dùng 3306
    waitForConnections: true,
    connectionLimit: 10, // Có thể điều chỉnh nếu cần
    queueLimit: 0,
});

module.exports = pool;