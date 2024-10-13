const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");
const ExcelJS = require('exceljs');
const router = express.Router();
const mysql = require('mysql2/promise');
const xlsx = require('xlsx');


let gvmLists ; 


let query;
const getGvmList = async (req, res) => {
  const role = req.session.role;
  const parts = role.split("_");
  if (role.includes("DAOTAO")) {
    query = `select * from gvmoi`;
  } else {
    // query = `SELECT * FROM gvmoi WHERE MaPhongBan = '${parts[0]}'`;
    query = `SELECT * FROM gvmoi WHERE MaPhongBan LIKE '%${parts[0]}%'`;
  }

  const connection = await createConnection();

  const [results, fields] = await connection.query(query);
  gvmLists = results;

  // Push thông tin giảng viên vào mảng gvmLists
 

  res.render("gvmList.ejs", { gvmLists: gvmLists });
};


const getGvm = async (req, res) => {
  try {
    res.json(gvmLists); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

async function fetchGvmData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'csdl_last'
  });

  const [rows] = await connection.execute('SELECT * FROM gvmoi'); // Thay đổi theo bảng giảng viên mời
  return rows;
}

// Hàm xuất dữ liệu ra Excel
const exportGvmToExcel = async (req, res) => {
  console.log('Hàm exportGvmToExcel được gọi');
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'csdl_last'
    });
    console.log('Kết nối database thành công');
    const [rows] = await connection.execute('SELECT * FROM gvmoi');
    console.log('Lấy dữ liệu từ bảng gvmoi thành công');
    if (rows.length === 0) {
      console.log('Không có dữ liệu để xuất khẩu');
      res.status(404).send('Không có dữ liệu để xuất khẩu');
      return;
    }
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'GiangVienMoi');
    console.log('Tạo file Excel thành công');
    const filePath = './gvmList.xlsx';
    xlsx.writeFile(wb, filePath);
    console.log('Ghi file Excel thành công');
    res.download(filePath, 'gvmList.xlsx', (err) => {
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

  
// // Khoa công nghệ thông tin
// const getGvmListCNTT = async (req, res) => {
//   const query = `select * from gvmoi where MaPhongBan = 'CNTT'`;

//   const connection = await createConnection();

//   const [results, fields] = await connection.query(query);
//   gvmLists = results;
//   res.render("KhoaCNTT/KhoaCnttMain.ejs", { gvmLists: results });
// };

// // const getGvm = (req, res) => {
// //   res.json(gvmLists);
// // };

// const getGvmCNTT = async (req, res) => {
//   try {
//     res.json(gvmLists); // Trả về danh sách giảng viên mời
//   } catch (error) {
//     console.error("Error fetching GVM list:", error);
//     res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
//   }
// };

//



// Xuất các hàm để sử dụng trong router
module.exports = {
  getGvmList,
  getGvm,
  exportGvmToExcel // Đảm bảo export controller này
};
