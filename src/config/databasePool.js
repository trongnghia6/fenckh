const mysql = require("mysql2/promise");
require("dotenv").config();

// Hàm tạo kết nối sử dụng async/await
async function createConnection() {
  try {
    // Tạo kết nối đến MySQL
    const connection = await mysql.createConnection({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 5432, // Sử dụng cổng 5432 nếu không có cổng
    });

    console.log("Kết nối MySQL thành công");
    return connection;
  } catch (error) {
    console.error("Lỗi khi kết nối MySQL:", error);
    throw error;
  }
}

module.exports = createConnection;