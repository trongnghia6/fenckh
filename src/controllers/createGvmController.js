const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const gvmList = require("../services/gvmServices");
const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
// const upload = multer({
//   dest: "uploads/", // Đường dẫn thư mục lưu trữ file
// });

const upload = multer().single("truocCCCD");

let handleUploadFile = async (req, res) => {
  const gvms = await gvmList.getGvmLists(req, res);
  role = req.session.role;
  const parts = role.split("_");

  lengthList = parseInt(gvms.length) + 1;
  // Lấy các thông tin từ form
  let MaGvm = parts[0] + "_GVM_" + lengthList;
  console.log("MaGvm = ", MaGvm);
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
  let tinhTrangGiangDay = req.body.tinhTrangGiangDay ? 1 : 0;
  let BangTotNghiepLoai = req.body.BangTotNghiepLoai;

  const MaPhongBan = Array.isArray(req.body.maPhongBan)
    ? req.body.maPhongBan.join(",") // Nếu là mảng
    : req.body.maPhongBan || ""; // Nếu là chuỗi hoặc không có giá trị

  // let MaPhongBan = req.body.MaPhongBan;

  // Sử dụng hàm upload để xử lý các file được gửi lên
  upload(req, res, function (err) {
    // Kiểm tra lỗi của Multer hoặc các vấn đề liên quan đến file upload
    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    } else if (!req.files || Object.keys(req.files).length === 0) {
      return res.send("Please select images to upload");
    } else if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }

    // Lấy tên file của các file được upload
    let truocCCCD = req.files["truocCCCD"]
      ? req.files["truocCCCD"][0].filename
      : null;
    let sauCCCD = req.files["sauCCCD"]
      ? req.files["sauCCCD"][0].filename
      : null;
    let bangTotNghiep = req.files["bangTotNghiep"]
      ? req.files["bangTotNghiep"][0].filename
      : null;
    let FileLyLich = req.files["FileLyLich"]
      ? req.files["FileLyLich"][0].filename
      : null;

    // Truy vấn để insert dữ liệu vào cơ sở dữ liệu
    const query = `INSERT INTO gvmoi (MaGvm, HoTen, GioiTinh, NgaySinh, CCCD, NgayCapCCCD, NoiCapCCCD, NoiCongTac, DiaChi, DienThoai, Email, MaSoThue, HocVi, ChucVu, HSL, STK, NganHang, MatTruocCCCD, MatSauCCCD, BangTotNghiep, FileLyLich, MaPhongBan, TinhTrangGiangDay, BangTotNghiepLoai)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(
      query,
      [
        MaGvm,
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
        truocCCCD, // Ảnh mặt trước CCCD
        sauCCCD, // Ảnh mặt sau CCCD
        bangTotNghiep,
        FileLyLich, // Giả sử đây là vị trí của FileLyLich (có thể cập nhật sau)
        MaPhongBan,
        tinhTrangGiangDay, // Tình trạng giảng dạy
        BangTotNghiepLoai,
      ],
      // function (err, results) {
      //   if (err) {
      //     console.error("Error executing query: ", err);
      //     return res.redirect("/gvmList?message=insertFalse");
      //   }
      //   res.redirect("/gvmList?message=insertSuccess");
      // }
      function (err, results) {
        if (err) {
          console.error("Error executing query: ", err);

          // Kiểm tra lỗi trùng MaGVM và CCCD
          if (err.code === "ER_DUP_ENTRY") {
            const errorMessage = err.sqlMessage;
            if (errorMessage.includes("uniq_MaGVM")) {
              // return res.status(400).json({
              //   success: false,
              //   message: "Mã giảng viên đã tồn tại. Vui lòng nhập mã khác.",
              // });
              return res.redirect("/gvmList?message=magiangvien");
            } else if (errorMessage.includes("uniq_CCCD")) {
              // return res.status(400).json({
              //   success: false,
              //   message: "CCCD đã tồn tại. Vui lòng kiểm tra lại số CCCD.",
              // });
              return res.redirect("/gvmList?message=cccd");
            }
          }

          return res.redirect("/gvmList?message=insertFalse");
        }
        res.redirect("/gvmList?message=insertSuccess");
      }
    );
  });
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  //  createGVM,
  handleUploadFile,
};
