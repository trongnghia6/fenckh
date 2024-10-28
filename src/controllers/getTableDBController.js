const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const createPoolConnection = require("../config/databasePool");

// Hàm lấy toàn bộ dữ liệu từ bảng quy chuẩn

let tableTam = process.env.DB_TABLE_TAM;
let tableQC = process.env.DB_TABLE_QC;

const getTableQC = async () => {
  let connection; // Khai báo biến connection
  try {
    connection = await createPoolConnection(); // Lấy kết nối từ pool
    const query = `SELECT * FROM ${tableQC}`; // Đổi tên bảng nếu cần
    const [results] = await connection.query(query); // Thực hiện truy vấn
    return results; // Trả kết quả
  } catch (error) {
    console.error("Lỗi trong hàm getTableQC:", error);
    throw error; // Ném lại lỗi cho caller
  } finally {
    if (connection) connection.release(); // Giải phóng kết nối
  }
};

const getTableTam = async () => {
  let connection; // Khai báo biến connection
  try {
    connection = await createPoolConnection(); // Lấy kết nối từ pool
    const query = `SELECT * FROM ${tableTam}`; // Đổi tên bảng nếu cần
    const [results] = await connection.query(query); // Thực hiện truy vấn
    return results; // Trả kết quả
  } catch (error) {
    console.error("Lỗi trong hàm getTableTam:", error);
    throw error; // Ném lại lỗi cho caller
  } finally {
    if (connection) connection.release(); // Giải phóng kết nối
  }
};

// const getTableQC = async () => {
//   try {
//     const query = `SELECT * FROM ${tableQC}`; // Đổi tên bảng nếu cần
//     const results = await new Promise((resolve, reject) => {
//       connection.query(query, (error, results) => {
//         if (error) {
//           console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
//           return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.')); // Kết thúc nếu có lỗi
//         }
//         resolve(results); // Trả về dữ liệu
//       });
//     });
//     return results; // Trả kết quả
//   } catch (error) {
//     console.error('Lỗi trong hàm getTableQC:', error);
//     throw error; // Ném lại lỗi cho caller
//   }
// };

// const getTableTam = async () => {
//   try {
//     const query = `SELECT * FROM ${tableTam}`; // Đổi tên bảng nếu cần
//     const results = await new Promise((resolve, reject) => {
//       connection.query(query, (error, results) => {
//         if (error) {
//           console.error('Lỗi truy vấn cơ sở dữ liệu:', error);
//           return reject(new Error('Không thể truy xuất dữ liệu từ cơ sở dữ liệu.')); // Kết thúc nếu có lỗi
//         }
//         resolve(results); // Trả về dữ liệu
//       });
//     });
//     return results; // Trả kết quả
//   } catch (error) {
//     console.error('Lỗi trong hàm getTableQC:', error);
//     throw error; // Ném lại lỗi cho caller
//   }
// };

// Xuất các hàm để sử dụng
module.exports = { getTableQC, getTableTam };
