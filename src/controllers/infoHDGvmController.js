const express = require("express");
const createConnection = require("../config/databaseAsync");
const ExcelJS = require('exceljs');
const router = express.Router();
const mysql = require('mysql2/promise');
const xlsx = require('xlsx');

const getGvm = async (req, res) => {
    try {
      const gvmLists = await fetchHDGvmData();
      res.json(gvmLists); // Trả về danh sách giảng viên mời
    } catch (error) {
      console.error("Error fetching HD Gvm:", error);
      res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
    }
};

async function fetchHDGvmData() {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'ttcs'
    });
  
    const [rows] = await connection.execute('SELECT * FROM hopdonggvmoi'); // Thay đổi theo bảng giảng viên mời
    return rows;
}
  
// Hàm xuất dữ liệu ra Excel
const exportHDGvmToExcel = async (req, res) => {
    console.log('Hàm exportHDGvmToExcel được gọi');
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'ttcs'
      });
      console.log('Kết nối database thành công');
      const [rows] = await connection.execute('SELECT * FROM hopdonggvmoi');   // Đổi tên bảng ở đây
    
      console.log('Lấy dữ liệu từ bảng hopdonggvmoi thành công');
      if (rows.length === 0) {
        console.log('Không có dữ liệu để xuất khẩu');
        res.status(404).send('Không có dữ liệu để xuất khẩu');
        return;
      }
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'GiangVienMoi');
      console.log('Tạo file Excel thành công');
      const filePath = './hopdonggvmList.xlsx';
      xlsx.writeFile(wb, filePath);
      console.log('Ghi file Excel thành công');
      res.download(filePath, 'hopdonggvmList.xlsx', (err) => {
        if (err) {
          console.log('Lỗi khi tải file:', err);
        } else {
          console.log('File đã được tải thành công!');
        }
      });
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      res.status(500).send('Có lỗi xảy ra khi xuất dữ liệu');
    }
};

module.exports = {
    exportHDGvmToExcel,
};
