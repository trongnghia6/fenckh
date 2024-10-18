const express = require('express');
const mysql = require('mysql2/promise'); // Ensure you have mysql2 installed
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
      MaNhanVien, TenNhanVien, NgaySinh, DienThoai, HocVi, CCCD,
      NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
      MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
      MonGiangDayChinh, CacMonLienQuan
    } = req.body;

    try {
      const query = `
        INSERT INTO nhanvien (
          MaNhanVien, TenNhanVien, NgaySinh, DienThoai, HocVi, CCCD,
          NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
          MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
          MonGiangDayChinh, CacMonLienQuan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        MaNhanVien, TenNhanVien, NgaySinh, DienThoai, HocVi, CCCD,
        NgayCapCCCD, NoiCapCCCD, DiaChiHienNay, ChucVu, NoiCongTac,
        MaPhongBan, MaSoThue, SoTaiKhoan, NganHang, ChiNhanh,
        MonGiangDayChinh, CacMonLienQuan
      ];

      await connection.promise().query(query, values);

      res.status(200).json({ message: 'Thêm nhân viên thành công' });
    } catch (error) {
      console.error('Lỗi khi thêm nhân viên:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm nhân viên' });
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

        res.status(200).json({ message: 'Thêm phòng ban thành công' });
    } catch (error) {
        console.error('Lỗi khi thêm phòng ban:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm phòng ban' });
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

  // Other methods can be added here as needed...
};

module.exports = AdminController; // Export the entire controller