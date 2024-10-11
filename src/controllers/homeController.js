const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
const upload = multer({
  dest: "uploads/", // Đường dẫn thư mục lưu trữ file
});

// Các hàm khác

// const createUser = (req, res) => {
//   let maPhongBan = req.body.fname;
//   let maBoMon = req.body.lname;
//   let tenBoMon = req.body.email;
//   let all = [maPhongBan, maBoMon, tenBoMon];
//   console.log(all);
//   connection.query(
//     ` INSERT INTO bomon (MaPhongBan, MaBoMon, TenBoMon)
//     VALUES (?, ?, ?) `,
//     [maPhongBan, maBoMon, tenBoMon],
//     function (err, results) {
//       console.log(results);
//       res.send("Insert succeed");
//     }
//   );
// };

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
const getMainKhoa = (req, res) => {
  res.render("gvmList.ejs");
};
const getDtaonhap = (req, res) => {
  res.render("daotaonhap.ejs");
};
const getPhongTaiChinh = (req, res) => {
  res.render("PhongTaiChinh.ejs");
};
const gethomePage = (req, res) => {
  res.render("homepage.ejs");
};
const getHomeMainDaoTao = (req, res) => {
  res.render("maindt.ejs");
};
const getTeachingInfo = (req, res) => {
  res.render("teachingInfo.ejs");
};
const getXemBangQC = (req, res) => {
  res.render("tableQC.ejs");
};

// Khoa
const getMainKhoa = (req, res) => {
  res.render("mainkhoa.ejs");
};

// Lấy role
const getRole = (req, res) => {
  let role = req.session.role;

  console.log("role = ", role);
  try {
    res.json(role); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// Hàm postFile xử lý upload file Excel
const postFile = (req, res) => {
  // Sử dụng multer để upload file
  upload.single("excelFile")(req, res, function (err) {
    // Xử lý file sau khi upload thành công
    console.log(req.file); // Thông tin về file được upload

    // Bạn có thể thực hiện thêm các bước xử lý khác tại đây, ví dụ đọc dữ liệu từ file Excel

    res.send("File uploaded and processed successfully.");
  });
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  gethomePage,
  getLogin,
  getIndex,
  getImport,
  getDtaoduyet,
  getMainKhoa,
  getDtaonhap,
  getPhongTaiChinh,
  postFile,
  getHomeMainDaoTao,
  getTeachingInfo,
  getXemBangQC,
  // Khoa
  getMainKhoa,

  // Lấy role
  getRole,
};
