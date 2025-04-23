const mysql = require('mysql2/promise');
require('dotenv').config(); 
const pool = mysql.createPool({
    host: process.env.DB_HOST,       
    user: process.env.DB_USER,         
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_DATABASE, 
    port: process.env.DB_PORT || 3306, // Đọc port từ biến môi trường DB_PORT, nếu không có thì dùng 3306
    waitForConnections: true,
    connectionLimit: 20, 
    queueLimit: 0,
});

module.exports = pool;