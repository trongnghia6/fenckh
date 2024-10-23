const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const router = express.Router();
const createConnection = require("../config/databaseAsync");

const getUpdateGvm = async (req, res) => {
  const id_Gvm = parseInt(req.params.id) + 1;

  // lấy dữ liệu
  const connection2 = await createConnection();
  const query = "SELECT * FROM `gvmoi` WHERE id_Gvm = ?";
  const [results, fields] = await connection2.query(query, [id_Gvm]);
  //   console.log("id=", id_Gvm);
  //   console.log("results = ", results);

  let user = results && results.length > 0 ? results[0] : {};

  res.render("updateGvm.ejs", { value: user });
};
const getViewGvm = async (req, res) => {
  const id_Gvm = parseInt(req.params.id) + 1;

  // lấy dữ liệu
  const connection2 = await createConnection();
  const query = "SELECT * FROM `gvmoi` WHERE id_Gvm = ?";
  const [results, fields] = await connection2.query(query, [id_Gvm]);
  //   console.log("id=", id_Gvm);
  //   console.log("results = ", results);

  let user = results && results.length > 0 ? results[0] : {};

  res.render("viewGvm.ejs", { value: user });
};
const upload = multer().single("truocCCCD");

const postUpdateGvm = async (req, res) => {
  // Lấy các thông tin từ form
  let IdGvm = req.body.IdGvm;
  //let MaGvm = req.body.MaGvm.toUpperCase();
  let HoTen = req.body.HoTen;
  let GioiTinh = req.body.GioiTinh;
  let NgaySinh = req.body.NgaySinh;
  let CCCD = req.body.CCCD;
  let NgayCapCCCD = req.body.NgayCapCCCD;
  let NoiCapCCCD = req.body.NoiCapCCCD;
  let NoiCongTac = req.body.NoiCongTac;

  let DiaChi = req.body.DiaChi;
  let DienThoai = req.body.DienThoai;
  let email = req.body.email;
  let MaSoThue = req.body.MaSoThue;
  let HocVi = req.body.HocVi;
  let ChucVu = req.body.ChucVu;
  let HeSoLuong = req.body.HeSoLuong;
  let STK = req.body.STK;
  let NganHang = req.body.NganHang;
  let BangTotNghiepLoai = req.body.BangTotNghiepLoai;

  let oldTruocCCCD = req.body.oldTruocCCCD;
  let oldSauCCCD = req.body.oldSauCCCD;
  let oldFileLyLich = req.body.oldFileLyLich;
  let oldbangTotNghiep = req.body.oldbangTotNghiep;

  const MaPhongBan = Array.isArray(req.body.maPhongBan)
    ? req.body.maPhongBan.join(",") // Nếu là mảng
    : req.body.maPhongBan || ""; // Nếu là chuỗi hoặc không có giá trị

  let tinhTrangGiangDay = req.body.tinhTrangGiangDay ? 1 : 0;

  upload(req, res, function (err) {
    // if (req.fileValidationError) {
    //   return res.send(req.fileValidationError);
    // } else if (!req.files || Object.keys(req.files).length === 0) {
    //   return res.send("Please select images to upload");
    // } else if (err instanceof multer.MulterError) {
    //   return res.send(err);
    // } else if (err) {
    //   return res.send(err);
    // }
    let truocCCCD = req.files["truocCCCD"]
      ? req.files["truocCCCD"][0].filename
      : oldTruocCCCD; // Giữ nguyên đường dẫn cũ nếu không chọn file mới
    let sauCCCD = req.files["sauCCCD"]
      ? req.files["sauCCCD"][0].filename
      : oldSauCCCD; // Giữ nguyên đường dẫn cũ nếu không chọn file mới
    let bangTotNghiep = req.files["bangTotNghiep"]
      ? req.files["bangTotNghiep"][0].filename
      : oldbangTotNghiep;
    let FileLyLich = req.files["FileLyLich"]
      ? req.files["FileLyLich"][0].filename
      : oldFileLyLich;
      console.log('dữ liệu' ,bangTotNghiep);

    // Truy vấn để update dữ liệu vào cơ sở dữ liệu
    const query = `UPDATE gvmoi SET 
    HoTen = ?,
    GioiTinh = ?,
    NgaySinh = ?,
    CCCD = ?,
    NgayCapCCCD = ?,
    NoiCapCCCD = ?,
    NoiCongTac = ?,
    DiaChi = ?,
    DienThoai = ?,
    Email = ?,
    MaSoThue = ?,
    HocVi = ?,
    ChucVu = ?,
    HSL = ?,
    STK = ?,
    NganHang = ?,
    BangTotNghiepLoai = ?,
    MatTruocCCCD = ?,
    MatSauCCCD = ?,
    BangTotNghiep = ?,
    FileLyLich = ?,
    MaPhongBan = ?,
    TinhTrangGiangDay = ? 
    WHERE id_Gvm = ?`;

  connection.query(
    query,
    [
      HoTen,
      GioiTinh,
      NgaySinh,
      CCCD,
      NgayCapCCCD,
      NoiCapCCCD,
      NoiCongTac,
      DiaChi,
      DienThoai,
      email,
      MaSoThue,
      HocVi,
      ChucVu,
      HeSoLuong,
      STK,
      NganHang,
      BangTotNghiepLoai,
      truocCCCD,
      sauCCCD,
      bangTotNghiep,
      FileLyLich,
      MaPhongBan,
      tinhTrangGiangDay,
      IdGvm,
    ],
      function (err, results) {
        if (err) {
          console.error("Error executing query: ", err);
          return res.redirect("/gvmList?message=insertFalse");
        }
        res.redirect("/gvmList?message=insertSuccess");
      }
    );
  });
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  getUpdateGvm,
  postUpdateGvm,
  getViewGvm,
};
