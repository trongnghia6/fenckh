require('dotenv').config();
const db = require('../controllers/connectDB'); // Import kết nối database
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

// Hàm xóa dữ liệu từ bảng
const deleteTableTam = async (req, res) => {
  const { Khoa, Dot, Ki, Nam } = req.body; // Lấy Khoa từ body
  console.log('Xóa khoa : ', Khoa)
  // Lấy tên bảng từ biến môi trường
  const tableTam = process.env.DB_TABLE_TAM;

  // Câu lệnh SQL để xóa dữ liệu
  const query = `DELETE FROM ?? WHERE Khoa = ? AND Dot = ? AND Ki = ? AND Nam = ?`; // Sử dụng ?? để tránh SQL injection

  // Thực thi câu lệnh SQL
  db.query(query, [tableTam, Khoa, Dot, Ki, Nam], (error, results) => {
    if (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa dữ liệu.' });
    }

    // Kiểm tra xem có bản ghi nào bị xóa không
    if (results.affectedRows > 0) {
      return res.json({ message: 'Xóa thành công dữ liệu.' });
    } else {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu để xóa.' });
    }
  });
};

// Xuất các hàm để sử dụng
module.exports = {
  deleteTableTam
};
