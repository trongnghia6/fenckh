const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");
const gvmList = require("../services/gvmServices");
// const XLSX = require("xlsx");
// const fs = require("fs");
require("dotenv").config();
const path = require("path");

const multer = require("multer");
const readXlsxFile = require("read-excel-file/node");

const getImportGvmList = (req, res) => {
  res.render("importGvmList.ejs");
};

// Cấu hình multer để lưu file tải lên trong thư mục 'uploads'
const upload = multer({ dest: "uploads/" });

// Đường dẫn đến thư mục cha
const parentDir = path.join(__dirname, "..");
const p = path.join(parentDir, "..");

let data;
const convertExcelToJSON = (req, res) => {
  const filePath = path.join(p, "/uploads", req.file.filename);

  // Đọc file Excel
  readXlsxFile(filePath)
    .then((rows) => {
      console.log("Dữ liệu trong file:", rows);
      data = rows;
      res.send("Tải lên và đọc file thành công!");
    })
    .catch((error) => {
      console.error("Lỗi khi đọc file:", error);
      res.status(500).send("Đã xảy ra lỗi khi đọc file!");
    });
};

// Xử lý
const getArrValue = async (req, res) => {
  // Lấy tiêu đề
  const headers = data[0]; // Lấy hàng tiêu đề

  // Lấy tất cả các hàng dữ liệu
  const rows = data.slice(1); // Lấy các hàng từ chỉ mục 1 đến cuối

  // Chuyển đổi thành mảng các đối tượng
  const result = rows.map((row) => {
    return headers.reduce((acc, header, index) => {
      acc[header] = row[index];
      return acc;
    }, {});
  });
};

const displayGvmListInput = (req, res) => {};

// Xuất các hàm để sử dụng trong router
module.exports = {
  getImportGvmList,
  convertExcelToJSON,
  getArrValue,
};
