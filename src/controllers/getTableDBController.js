const XLSX = require('xlsx');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const connection = require('../controllers/connectDB'); // Giả định rằng bạn đã cấu hình kết nối ở đây


let tableTam = process.env.DB_TABLE_TAM;
let tableQC = process.env.DB_TABLE_QC;


const getTableQC = async (req, res) => {
  const { Khoa, Dot, Ki, Nam } = req.body;
  // console.log(req.body)

  console.log('Lấy dữ liệu bảng tạm Khoa Đợt Kì Năm :', Khoa, Dot, Ki, Nam);

  if (Khoa != 'ALL') {
    try {
      const query = `SELECT * FROM ${tableQC} WHERE Khoa = ? AND Dot = ? AND KiHoc = ? AND NamHoc = ?`;
      const results = await new Promise((resolve, reject) => {
        connection.query(query, [Khoa, Dot, Ki, Nam], (error, results) => {
          if (error) {
            console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
            return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.'));
          }
          resolve(results);
        });
      });
      res.json(results); // Trả về kết quả dưới dạng JSON
    } catch (error) {
      console.error('Lỗi trong hàm getTableTam:', error);
      res.status(500).json({ message: 'Không thể truy xuất dữ liệu từ cơ sở dữ liệu.' });
    }
  } else {
    try {
      const query = `SELECT * FROM ${tableQC} WHERE Dot = ? AND KiHoc = ? AND NamHoc = ?`;
      const results = await new Promise((resolve, reject) => {
        connection.query(query, [Dot, Ki, Nam], (error, results) => {
          if (error) {
            console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
            return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.'));
          }
          resolve(results);
        });
      });
      res.json(results); // Trả về kết quả dưới dạng JSON
    } catch (error) {
      console.error('Lỗi trong hàm getTableTam:', error);
      res.status(500).json({ message: 'Không thể truy xuất dữ liệu từ cơ sở dữ liệu.' });
    }
  }
};

const getTableTam = async (req, res) => {
  const { Khoa, Dot, Ki, Nam } = req.body;
  // console.log(req.body)

  console.log('Lấy dữ liệu bảng tạm Khoa Đợt Kì Năm :', Khoa, Dot, Ki, Nam);

  if (Khoa != 'ALL') {
    try {
      const query = `SELECT * FROM ${tableTam} WHERE Khoa = ? AND Dot = ? AND Ki = ? AND Nam = ?`;
      const results = await new Promise((resolve, reject) => {
        connection.query(query, [Khoa, Dot, Ki, Nam], (error, results) => {
          if (error) {
            console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
            return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.'));
          }
          resolve(results);
        });
      });
      res.json(results); // Trả về kết quả dưới dạng JSON
    } catch (error) {
      console.error('Lỗi trong hàm getTableTam:', error);
      res.status(500).json({ message: 'Không thể truy xuất dữ liệu từ cơ sở dữ liệu.' });
    }
  } else {
    try {
      const query = `SELECT * FROM ${tableTam} WHERE Dot = ? AND Ki = ? AND Nam = ?`;
      const results = await new Promise((resolve, reject) => {
        connection.query(query, [Dot, Ki, Nam], (error, results) => {
          if (error) {
            console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
            return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.'));
          }
          resolve(results);
        });
      });
      res.json(results); // Trả về kết quả dưới dạng JSON
    } catch (error) {
      console.error('Lỗi trong hàm getTableTam:', error);
      res.status(500).json({ message: 'Không thể truy xuất dữ liệu từ cơ sở dữ liệu.' });
    }
  }
};




// Xuất các hàm để sử dụng
module.exports = { getTableQC, getTableTam };
