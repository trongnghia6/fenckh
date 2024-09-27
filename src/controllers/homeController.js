const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
const upload = multer({
  dest: "uploads/" // Đường dẫn thư mục lưu trữ file
});

// Các hàm khác
const getAbc = (req, res) => {
  res.send("What do you want");
};

const getHomePage = (req, res) => {
  return res.render("homePage.ejs");
};

const createUser = (req, res) => {
  let maPhongBan = req.body.fname;
  let maBoMon = req.body.lname;
  let tenBoMon = req.body.email;
  let all = [maPhongBan, maBoMon, tenBoMon];
  console.log(all);
  connection.query(
    ` INSERT INTO bomon (MaPhongBan, MaBoMon, TenBoMon)
    VALUES (?, ?, ?) `,
    [maPhongBan, maBoMon, tenBoMon],
    function (err, results) {
      console.log(results);
      res.send("Insert succeed");
    }
  );
};

const getLogin = (req, res) => {
  res.render("login.ejs");
};

const getIndex = (req, res) => {
  res.render("index.ejs");
};

const getImport = (req, res) => {
  res.render("import.ejs");
};
const getDtaoduyet = (req, res) => {
  res.render("daotaoduyet.ejs");
};
const getDtaoxemhd = (req, res) => {
  res.render("daotaoxemhd.ejs");
};
const getPhongTaiChinh = (req, res) => {
  res.render("PhongTaiChinh.ejs");
};
const gethomePage = (req, res) => {
  res.render("homepage.ejs");
};

// Hàm postFile xử lý upload file Excel
const postFile = (req, res) => {
  // Sử dụng multer để upload file
  upload.single('excelFile')(req, res, function (err) {

    // Xử lý file sau khi upload thành công
    console.log(req.file); // Thông tin về file được upload

    // Bạn có thể thực hiện thêm các bước xử lý khác tại đây, ví dụ đọc dữ liệu từ file Excel

    res.send("File uploaded and processed successfully.");
  });
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  gethomePage,
  getAbc,
  createUser,
  getLogin,
  getIndex,
  getImport,
  getDtaoduyet,
  getDtaoxemhd,
  getPhongTaiChinh,
  postFile,  // Thêm hàm này vào export để sử dụng trong router
};
