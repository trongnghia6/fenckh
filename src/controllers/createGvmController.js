const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
const upload = multer({
  dest: "uploads/", // Đường dẫn thư mục lưu trữ file
});

const createGVM = (req, res) => {
  console.log("Request Body: ", req.body);
  let Id_GVM = req.body.Id_GVM;
  let HoTen = req.body.HoTen;
  let GioiTinh = req.body.GioiTinh;
  let NgaySinh = req.body.NgaySinh;
  let CCCD = req.body.CCCD;
  let DiaChi = req.body.DiaChi;
  let DienThoai = req.body.DienThoai;
  let email = req.body.email;
  let MaSoThue = req.body.MaSoThue;
  let HocVi = req.body.HocVi;
  let ChucVu = req.body.ChucVu;
  let HeSoLuong = req.body.HeSoLuong;
  let STK = req.body.STK;
  let NganHang = req.body.NganHang;
  let MaPhongBan = 5;
  console.log("HoTen: ", HoTen);

  const query = `INSERT INTO gvmoi (id_GVM, HoTen, GioiTinh, NgaySinh, CCCD, DiaChi, DienThoai, Email, MaSoThue, HocVi, ChucVu, HSL, STK, NganHang, MatTruocCCCD, MatSauCCCD, FileLyLich, MaPhongBan, MaBoMon, TinhTrangGiangDay)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(
    query,
    [
      Id_GVM,
      HoTen,
      GioiTinh,
      NgaySinh,
      CCCD,
      DiaChi,
      DienThoai,
      email,
      MaSoThue,
      HocVi,
      ChucVu,
      HeSoLuong,
      STK,
      NganHang,
      "0",
      "0",
      "0",
      MaPhongBan,
      "0",
      "1",
    ],
    // function (err, results) {
    //   console.log(results);
    //   res.send("Insert succeed");
    // }
    function (err, results) {
      if (err) {
        console.error("Error executing query: ", err);
        res.status(500).send("Error inserting data");
        return;
      }
      console.log("Results: ", results);
      res.send("Insert succeed");
    }
  );
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  createGVM,
};
