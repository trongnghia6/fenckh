// getTableDBController.js
require('dotenv').config();
const connection = require('../controllers/connectDB');

const updateTableQC = async (data) => {
  const tableName = process.env.DB_TABLE_NAME; // Tên bảng quy chuẩn

  // Thay đổi để chỉ sử dụng trường lopHocPhan
  const updatePromises = data.map(item => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE ${tableName}
        SET 
          GiaoVienGiangDay = ?,  -- Cập nhật GiaoVienGiangDay
          MoiGiang = ?           -- Cập nhật MoiGiang
        WHERE LopHocPhan = ?;    -- Điều kiện tìm kiếm
      `;

      const values = [
        item['giaoVienGiangDay'], // Tên giáo viên giảng dạy
        item['gvMoi'],            // Giá trị mới của trường MoiGiang
        item['lopHocPhan']        // Điều kiện tìm kiếm theo LopHocPhan
      ];

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error('Error:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  });

  let results = false;
  try {
    await Promise.all(updatePromises);
    results = true;
  } catch (error) {
    console.error('Error:', error);
  }

  return results;
};

module.exports = {
  updateTableQC,
};
