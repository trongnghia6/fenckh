const express = require('express');
const mysql = require('mysql2/promise'); // Ensure you have mysql2 installed
const createConnection = require("../config/databaseAsync");
const connection = require('../config/database'); // Adjust the path as necessary

const AdminController = {
  index: (req, res) => {
    res.render('admin', { title: 'Trang admin' });
  },

  showThemTaiKhoan: (req, res) => {
    res.render('themTK', { title: 'Thêm Tài Khoản' });
  },

  showThemNhanVien: (req, res) => {
    res.render('themNhanVien', { title: 'Thêm Nhân Viên' });
  },

  showThemPhongBan: (req, res) => {
    res.render('themPhongBan', { title: 'Thêm Phòng Ban' });
  },


 // phần thêm 
  themNhanVien: async (req, res) => {
    const {
      TenNhanVien, NgaySinh, GioiTinh, DienThoai, HocVi, CCCD,
      NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
      MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
      MonGiangDayChinh, CacMonLienQuan
  } = req.body;

  try {
      // Đầu tiên, chèn dữ liệu vào CSDL mà không cần MaNhanVien
      const queryInsert = `
          INSERT INTO nhanvien (
              TenNhanVien, NgaySinh, GioiTinh, DienThoai, HocVi, CCCD,
              NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
              MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
              MonGiangDayChinh, CacMonLienQuan
          ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const valuesInsert = [
          TenNhanVien, NgaySinh, GioiTinh, DienThoai, HocVi, CCCD,
          NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
          MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
          MonGiangDayChinh, CacMonLienQuan
      ];

      // Chèn nhân viên và lấy id_User vừa tạo
      const [result] = await connection.promise().query(queryInsert, valuesInsert);
      const id_User = result.insertId; // Lấy id_User vừa được tạo

      // Tạo MaNhanVien bằng cách ghép MaPhongBan với id_User
      const MaNhanVien = `${MaPhongBan}${id_User}`;

      // Cập nhật lại MaNhanVien trong CSDL
      const queryUpdate = `UPDATE nhanvien SET MaNhanVien = ? WHERE id_User = ?`;
      await connection.promise().query(queryUpdate, [MaNhanVien, id_User]);
 
       res.status(200).json({ message: 'Thêm nhân viên thành công', MaNhanVien: MaNhanVien });
     } catch (error) {
      console.error('Lỗi khi thêm nhân viên:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm nhân viên', error: error.message });
    }
  },

  themPhongBan: async (req, res) => {
    const { maPhongBan, tenPhongBan, ghiChu, khoa } = req.body;

    try {
        const query = `
            INSERT INTO phongban (maPhongBan, tenPhongBan, ghiChu, isKhoa)
            VALUES (?, ?, ?, ?)
        `;

        const values = [maPhongBan, tenPhongBan, ghiChu, khoa ? 1 : 0];

        await connection.promise().query(query, values);
        res.redirect('/phongBan?themphongbanthanhcong')
      } catch (error) {
        console.error('Lỗi khi thêm phòng ban:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm phòng ban' });
    }
},
themTaiKhoan: async (req, res) => {
  const { TenDangNhap, MatKhau, id_User} = req.body;

  try {
      const query = `
          INSERT INTO taikhoannguoidung (TenDangNhap, MatKhau, id_User)
          VALUES (?, ?, ?)
      `;

      const values = [TenDangNhap, MatKhau, id_User];

      await connection.promise().query(query, values);
      res.redirect('/thongTinTK?themtaikhoanthanhcong')

    } catch (error) {
      console.error('Lỗi khi thêm tài khoản:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm tài khoản', error: error.message });
  }
},
phanQuyen: async (req, res) => {
  const { TenDangNhap, MaPhongBan, Quyen, isKhoa} = req.body;

  try {
      const query = `
          INSERT INTO role (TenDangNhap, MaPhongBan, Quyen, isKhoa)
          VALUES (?, ?, ?, ?)
      `;

      const values = [TenDangNhap, MaPhongBan, Quyen, isKhoa ? 1 : 0];

      await connection.promise().query(query, values);
      res.redirect('/thongTinTK?phanquyenthanhcong')

    } catch (error) {
      console.error('Lỗi khi thêm tài khoản:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm tài khoản', error: error.message });
  }
},

getNhanVien: (req, res) => {
  res.render('nhanVien', { title: 'Danh sách nhân viên' });
},



// phần hiển thị danh sách 
getListNhanVien: async (req, res) => {
  try {
    const [rows] = await connection.promise().query(
      'SELECT id_User, MaNhanVien, TenNhanVien, MaPhongBan FROM nhanvien'
    );
    res.json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhân viên:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách nhân viên' });
  }
},
getPhongBan: (req, res) => {
  res.render('phongBan', { title: 'Danh sách phòng ban' });
},

getListPhongBan: async (req, res) => {
  try {
    console.log('Đang truy vấn danh sách phòng ban...');
    const [rows] = await connection.promise().query(
      'SELECT maPhongBan, tenPhongBan, ghiChu, isKhoa FROM phongban'
    );
    console.log('Kết quả truy vấn:', rows);
    res.json(rows);
  } catch (error) {
    console.error('Lỗi chi tiết khi lấy danh sách phòng ban:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách phòng ban', error: error.message });
  }
},
getUpdateNV: async (req, res) => {
  try {
    const id_User = parseInt(req.params.id) + 1;

    // Lấy dữ liệu nhân viên
    const connection2 = await createConnection();
    const query1 = "SELECT * FROM `nhanvien` WHERE id_User = ?";
    const [results1] = await connection2.query(query1, [id_User]);
    let user = results1 && results1.length > 0 ? results1[0] : {};

    // Lấy dữ liệu phòng ban
    const connection = await createConnection();
    const query2 = 'SELECT * FROM phongban';
    const [results2] = await connection.query(query2);
    let departmentLists = results2; // Gán kết quả vào departmentLists

    // Render trang với 2 biến: value và departmentLists
    res.render("updateNV.ejs", { value: user, departmentLists: departmentLists });
  } catch (error) {
    console.error("Lỗi: ", error);
    res.status(500).send("Đã có lỗi xảy ra");
  }
},


  // Other methods can be added here as needed...
};

module.exports = AdminController; // Export the entire controller