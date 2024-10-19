const express = require('express');
const mysql = require('mysql2/promise'); // Ensure you have mysql2 installed
const createConnection = require("../config/databaseAsync");
const connection = require('../config/database'); // Adjust the path as necessary

const postUpdateNV = async (req, res) => {
    // Lấy các thông tin từ form
    //let MaNV = req.body.MaNV.toUpperCase();
    let TenNhanVien = req.body.TenNhanVien;
    let GioiTinh = req.body.GioiTinh;
    let NgaySinh = req.body.NgaySinh;
    let CCCD = req.body.CCCD;
    let NgayCapCCCD = req.body.NgayCapCCCD;
    let NoiCapCCCD = req.body.NoiCapCCCD;
    // let NoiCongTac = req.body.NoiCongTac;
  
    let DiaChiHienNay = req.body.DiaChiHienNay;
    let DienThoai = req.body.DienThoai;
    // let email = req.body.email;
    let MaSoThue = req.body.MaSoThue;
    let HocVi = req.body.HocVi;
    let ChucVu = req.body.ChucVu;
    // let HeSoLuong = req.body.HeSoLuong;
    let SoTaiKhoan = req.body.SoTaiKhoan;
    let NganHang = req.body.NganHang;
    let ChiNhanh = req.body.ChiNhanh;
    let MaPhongBan = req.body.MaPhongBan;
    let Id_User = req.body.Id_User; // Đảm bảo có giá trị này
    console.log(Id_User);
    console.log('TenNhanVien:', TenNhanVien);

    // upload(req, res, function (err) {
      // Truy vấn để update dữ liệu vào cơ sở dữ liệu
      const query = `UPDATE nhanvien SET 
      TenNhanVien = ?,
      GioiTinh = ?,
      NgaySinh = ?,
      CCCD = ?,
      NgayCapCCCD = ?,
      NoiCapCCCD = ?,
      DiaChiHienNay = ?,
      DienThoai = ?,
      MaSoThue = ?,
      HocVi = ?,
      ChucVu = ?,
      SoTaiKhoan = ?,
      NganHang = ?,
      ChiNhanh = ?,
      MaPhongBan = ? 
      WHERE id_User = ?`;
  
      connection.query(
        query,
        [
          TenNhanVien,
          GioiTinh,
          NgaySinh,
          CCCD,
          NgayCapCCCD,
          NoiCapCCCD,
          DiaChiHienNay,
          DienThoai,
          MaSoThue,
          HocVi,
          ChucVu,
          SoTaiKhoan,
          NganHang,
          ChiNhanh,
          MaPhongBan,
          Id_User,
        ],
        function (err, results) {
          if (err) {
            console.error("Error executing query: ", err);
            return res.redirect("/nhanVien?message=insertFalse");
          }
          console.log("Query Results: ", results);
          res.redirect("/nhanVien?message=insertSuccess");
        }
      );
    // });
  };
  const postDeleteNV = async (req, res) => {
    let Id_User = req.body.Id_User;

    // Xóa bản ghi trong bảng giangday trước
    const deleteGiangDayQuery = `DELETE FROM giangday WHERE id_User = ?`;
    
    connection.query(deleteGiangDayQuery, [Id_User], function(err, results) {
        if (err) {
            console.error("Error deleting from giangday: ", err);
            return res.redirect("/nhanVien?message=deleteFalse");
        }

        // Sau khi xóa xong, xóa bản ghi trong bảng nhanvien
        const deleteNVQuery = `DELETE FROM nhanvien WHERE id_User = ?`;
        
        connection.query(deleteNVQuery, [Id_User], function(err, results) {
            if (err) {
                console.error("Error deleting from nhanvien: ", err);
                return res.redirect("/nhanVien?message=deleteFalse");
            }

            res.redirect("/nhanVien?message=deleteSuccess");
        });
    });
};
const postUpdatePhongBan = async (req, res) => {
  try {
    const MaPhongBan = req.params.MaPhongBan;
    const { tenPhongBan, ghiChu, khoa } = req.body;
    const isKhoa = khoa ? 1 : 0;

    const query = `UPDATE phongban SET TenPhongBan = ?, GhiChu = ?, isKhoa = ? WHERE MaPhongBan = ?`;
    const connection = await createConnection();
    await connection.query(query, [tenPhongBan, ghiChu, isKhoa, MaPhongBan]);

    res.redirect("/phongBan"); // Điều hướng về danh sách phòng ban sau khi cập nhật
  } catch (error) {
    console.error("Lỗi khi cập nhật dữ liệu: ", error);
    res.status(500).send("Lỗi server, không thể cập nhật dữ liệu");
  }
};
  const postUpdateTK = async (req, res) => {
  const TenDangNhap = req.params.TenDangNhap;
  const connection = await createConnection();
  const id_User = req.body.id_User;
  const MatKhau = req.body.MatKhau;
  const MaPhongBan = req.body.MaPhongBan;
  const Quyen = req.body.Quyen;
  const Khoa = req.body.isKhoa;
  const isKhoa = Khoa ? 1 : 0;
  console.log(TenDangNhap,id_User, MatKhau, MaPhongBan, Quyen, isKhoa);

  try {
    // Cập nhật bảng đầu tiên
    const query1 = 'UPDATE role SET MaPhongBan = ?, Quyen = ?, isKhoa = ? WHERE TenDangNhap = ?';
    await connection.query(query1, [MaPhongBan, Quyen, isKhoa, TenDangNhap]);

    // Cập nhật bảng thứ hai
    const query2 = 'UPDATE taikhoannguoidung SET id_User = ?, MatKhau = ? WHERE TenDangNhap = ?';
    await connection.query(query2, [id_User, MatKhau, TenDangNhap]);

    res.redirect('/thongTinTK?Success');
} catch (error) {
    console.error("Lỗi khi cập nhật dữ liệu: ", error.message);
    res.status(500).send(`Lỗi server, không thể cập nhật dữ liệu. Chi tiết: ${error.message}`);
} finally {
    if (connection) {
        await connection.end(); // Đóng kết nối
    }
}

};


  module.exports = {
    postUpdateNV,
    postDeleteNV,
    postUpdatePhongBan,
    postUpdateTK,
  }