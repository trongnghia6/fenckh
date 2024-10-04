const express = require("express");
const multer = require("multer");
const connection = require("../config/database");

const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
// const upload = multer({
//   dest: "uploads/", // Đường dẫn thư mục lưu trữ file
// });

const upload = multer().single("truocCCCD");

// const createGVM = async (req, res) => {
//   //  console.log("Request Body: ", req.body);
//   let Id_GVM = req.body.Id_GVM;
//   let HoTen = req.body.HoTen;
//   let GioiTinh = req.body.GioiTinh;
//   let NgaySinh = req.body.NgaySinh;
//   let CCCD = req.body.CCCD;
//   let DiaChi = req.body.DiaChi;
//   let DienThoai = req.body.DienThoai;
//   let email = req.body.email;
//   let MaSoThue = req.body.MaSoThue;
//   let HocVi = req.body.HocVi;
//   let ChucVu = req.body.ChucVu;
//   let HeSoLuong = req.body.HeSoLuong;
//   let STK = req.body.STK;
//   let NganHang = req.body.NganHang;
//   let MaPhongBan = 5;
//   console.log("HoTen: ", HoTen);

//   const query = `INSERT INTO gvmoi (id_GVM, HoTen, GioiTinh, NgaySinh, CCCD, DiaChi, DienThoai, Email, MaSoThue, HocVi, ChucVu, HSL, STK, NganHang, MatTruocCCCD, MatSauCCCD, FileLyLich, MaPhongBan, MaBoMon, TinhTrangGiangDay)
//                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//   connection.query(
//     query,
//     [
//       Id_GVM,
//       HoTen,
//       GioiTinh,
//       NgaySinh,
//       CCCD,
//       DiaChi,
//       DienThoai,
//       email,
//       MaSoThue,
//       HocVi,
//       ChucVu,
//       HeSoLuong,
//       STK,
//       NganHang,
//       "0",
//       "0",
//       "0",
//       MaPhongBan,
//       "0",
//       "1",
//     ],
//     // function (err, results) {
//     //   console.log(results);
//     //   res.send("Insert succeed");
//     // }
//     function (err, results) {
//       if (err) {
//         console.error("Error executing query: ", err);
//         res.status(500).send("Error inserting data");
//         return;
//       }
//       console.log("Results: ", results);
//       res.send("Insert succeed");
//     }
//   );
// };

// const upload = multer().single("truocCCCD");

// let handleUploadFile = async (req, res) => {
//   // Thêm thông tin khác
//   // console.log("req.body: ", req.body);
//   // let Id_GVM = req.body.Id_GVM;
//   // let HoTen = req.body.HoTen;
//   // let GioiTinh = req.body.GioiTinh;
//   // let NgaySinh = req.body.NgaySinh;
//   // let CCCD = req.body.CCCD;
//   // let DiaChi = req.body.DiaChi;
//   // let DienThoai = req.body.DienThoai;
//   // let email = req.body.email;
//   // let MaSoThue = req.body.MaSoThue;
//   // let HocVi = req.body.HocVi;
//   // let ChucVu = req.body.ChucVu;
//   // let HeSoLuong = req.body.HeSoLuong;
//   // let STK = req.body.STK;
//   // let NganHang = req.body.NganHang;
//   // let truocCCCD = req.body.truocCCCD;
//   // let MaPhongBan = 5;
//   // console.log("HoTen: ", truocCCCD);

//   // const query = `INSERT INTO gvmoi (id_GVM, HoTen, GioiTinh, NgaySinh, CCCD, DiaChi, DienThoai, Email, MaSoThue, HocVi, ChucVu, HSL, STK, NganHang, MatTruocCCCD, MatSauCCCD, FileLyLich, MaPhongBan, MaBoMon, TinhTrangGiangDay)
//   //                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//   console.log("req.body: ", req.body);
//   let Id_GVM = req.body.Id_GVM;
//   let HoTen = req.body.HoTen;
//   let GioiTinh = req.body.GioiTinh;
//   let NgaySinh = req.body.NgaySinh;
//   let CCCD = req.body.CCCD;
//   let DiaChi = req.body.DiaChi;
//   let DienThoai = req.body.DienThoai;
//   let email = req.body.email;
//   let MaSoThue = req.body.MaSoThue;
//   let HocVi = req.body.HocVi;
//   let ChucVu = req.body.ChucVu;
//   let HeSoLuong = req.body.HeSoLuong;
//   let STK = req.body.STK;
//   let NganHang = req.body.NganHang;
//   let MaPhongBan = 5;

//   console.log("dang xu lys file");
//   // 'truocCCCD' is the name of our file input field in the HTML form
//   upload(req, res, function (err) {
//     // req.file contains information of uploaded file
//     // req.body contains information of text fields, if there were any
//     if (req.fileValidationError) {
//       return res.send(req.fileValidationError);
//     } else if (!req.file) {
//       return res.send("Please select an image to upload");
//     } else if (err instanceof multer.MulterError) {
//       return res.send(err);
//     } else if (err) {
//       return res.send(err);
//     }

//     // Insert to db
//     // let truocCCCD = req.file ? req.file.filename : null;
//     let truocCCCD = req.files["truocCCCD"]
//       ? req.files["truocCCCD"][0].filename
//       : null;
//     let sauCCCD = req.files["sauCCCD"]
//       ? req.files["sauCCCD"][0].filename
//       : null;

//     console.log("Mặt trước CCCD: ", truocCCCD);
//     console.log("Mặt sau CCCD: ", sauCCCD);

//     const query = `INSERT INTO gvmoi (id_GVM, HoTen, GioiTinh, NgaySinh, CCCD, DiaChi, DienThoai, Email, MaSoThue, HocVi, ChucVu, HSL, STK, NganHang, MatTruocCCCD, MatSauCCCD, FileLyLich, MaPhongBan, MaBoMon, TinhTrangGiangDay)
//                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     connection.query(
//       query,
//       [
//         Id_GVM,
//         HoTen,
//         GioiTinh,
//         NgaySinh,
//         CCCD,
//         DiaChi,
//         DienThoai,
//         email,
//         MaSoThue,
//         HocVi,
//         ChucVu,
//         HeSoLuong,
//         STK,
//         NganHang,
//         "0",
//         "0",
//         "0",
//         MaPhongBan,
//         "0",
//         "1",
//       ],
//       // function (err, results) {
//       //   console.log(results);
//       //   res.send("Insert succeed");
//       // }
//       function (err, results) {
//         if (err) {
//           console.error("Error executing query: ", err);
//           // res.status(500).send("Error inserting data");
//           res.redirect("/daotaoxemhd/daotaonhap?message=insertFalse");
//           return;
//         }
//         console.log("Results: ", results);
//         res.redirect("/daotaoxemhd/daotaonhap?message=insertSuccess");
//       }
//     );

//     // Display uploaded image for user validation
//     // res.send(
//     //   `You have uploaded this image: <hr/><img src="/image/${req.file.filename}" width="500"><hr /><a href="/upload">Upload another image</a>`
//     // );
//   });
// };

let handleUploadFile = async (req, res) => {
  console.log("req.body: ", req.body);

  // Lấy các thông tin từ form
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

  const MaPhongBan = Array.isArray(req.body.maPhongBan)
    ? req.body.maPhongBan.join(",") // Nếu là mảng
    : req.body.maPhongBan || ""; // Nếu là chuỗi hoặc không có giá trị

  let tinhTrangGiangDay = req.body.tinhTrangGiangDay;
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

    console.log("Mặt trước CCCD: ", truocCCCD);
    console.log("Mặt sau CCCD: ", sauCCCD);

    // Truy vấn để insert dữ liệu vào cơ sở dữ liệu
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
        truocCCCD, // Ảnh mặt trước CCCD
        sauCCCD, // Ảnh mặt sau CCCD
        "0", // Giả sử đây là vị trí của FileLyLich (có thể cập nhật sau)
        MaPhongBan,
        "0", // Mã bộ môn (có thể cập nhật sau)
        tinhTrangGiangDay, // Tình trạng giảng dạy
      ],
      function (err, results) {
        if (err) {
          console.error("Error executing query: ", err);
          return res.redirect("/daotaoxemhd/daotaonhap?message=insertFalse");
        }
        console.log("Kết quả: ", results);
        res.redirect("/daotaoxemhd/daotaonhap?message=insertSuccess");
      }
    );
  });
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  //  createGVM,
  handleUploadFile,
};
