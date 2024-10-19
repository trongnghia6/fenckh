const express = require("express");
const mysql = require("mysql2/promise"); // Ensure you have mysql2 installed
const createConnection = require("../config/databaseAsync");
const connection = require("../config/database"); // Adjust the path as necessary

const AdminController = {
  index: (req, res) => {
    res.render("admin", { title: "Trang admin" });
  },

  showThemTaiKhoan: (req, res) => {
    res.render("themTK", { title: "Thêm Tài Khoản" });
  },

  showThemNhanVien: (req, res) => {
    res.render("themNhanVien", { title: "Thêm Nhân Viên" });
  },

  showThemPhongBan: (req, res) => {
    res.render("themPhongBan", { title: "Thêm Phòng Ban" });
  },

  // phần thêm
  themNhanVien: async (req, res) => {
    const {
      TenNhanVien,
      NgaySinh,
      GioiTinh,
      DienThoai,
      HocVi,
      CCCD,
      NgayCapCCCD,
      NoiCapCCCD,
      DiaChiHienNay,
      ChucVu,
      NoiCongTac,
      MaPhongBan,
      MaSoThue,
      SoTaiKhoan,
      NganHang,
      ChiNhanh,
      MonGiangDayChinh,
      CacMonLienQuan,
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
        TenNhanVien,
        NgaySinh,
        GioiTinh,
        DienThoai,
        HocVi,
        CCCD,
        NgayCapCCCD,
        NoiCapCCCD,
        DiaChiHienNay,
        ChucVu,
        NoiCongTac,
        MaPhongBan,
        MaSoThue,
        SoTaiKhoan,
        NganHang,
        ChiNhanh,
        MonGiangDayChinh,
        CacMonLienQuan,
      ];

      console.log(MaPhongBan);
      // Chèn nhân viên và lấy id_User vừa tạo
      const [result] = await connection
        .promise()
        .query(queryInsert, valuesInsert);
      const id_User = result.insertId; // Lấy id_User vừa được tạo

      // Tạo MaNhanVien bằng cách ghép MaPhongBan với id_User
      const MaNhanVien = `${MaPhongBan}${id_User}`;

      // Cập nhật lại MaNhanVien trong CSDL
      const queryUpdate = `UPDATE nhanvien SET MaNhanVien = ? WHERE id_User = ?`;
      await connection.promise().query(queryUpdate, [MaNhanVien, id_User]);

      res
        .status(200)
        .json({ message: "Thêm nhân viên thành công", MaNhanVien: MaNhanVien });
    } catch (error) {
      console.error("Lỗi khi thêm nhân viên:", error);
      res.status(500).json({
        message: "Đã xảy ra lỗi khi thêm nhân viên",
        error: error.message,
      });
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
      res.redirect("/phongBan?themphongbanthanhcong");
    } catch (error) {
      console.error("Lỗi khi thêm phòng ban:", error);
      res.status(500).json({ message: "Đã xảy ra lỗi khi thêm phòng ban" });
    }
  },
  getthemTaiKhoan: async (req, res) => {
    try {
      // Kết nối tới cơ sở dữ liệu
      const connection = await createConnection();

      // Lấy dữ liệu phòng ban
      const query2 = "SELECT * FROM phongban";
      const [results2] = await connection.query(query2);
      let departmentLists = results2;

      // Lấy dữ liệu bảng nhân viên
      const query4 = "SELECT * FROM nhanvien";
      const [results4] = await connection.query(query4);
      let user = results4;

      // Render trang với 2 biến: departmentLists và user
      res.render("themTk.ejs", {
        departmentLists: departmentLists,
        user: user,
      });
    } catch (error) {
      console.error("Lỗi: ", error);
      res.status(500).send("Đã có lỗi xảy ra");
    }
  },
  postthemTK: async (req, res) => {
    const TenDangNhap = req.body.TenDangNhap;
    const id_User = req.body.id_User;
    const MatKhau = req.body.MatKhau;
    const MaPhongBan = req.body.MaPhongBan;
    const Quyen = req.body.Quyen;
    const Khoa = req.body.isKhoa;
    const isKhoa = Khoa ? 1 : 0;
    const connection = await createConnection();

    try {
      // Cập nhật bảng thứ hai
      const query2 = `
      INSERT INTO taikhoannguoidung (TenDangNhap, id_User, MatKhau)
      VALUES (?, ?, ?)
    `;
      await connection.query(query2, [TenDangNhap, id_User, MatKhau]);

      // Cập nhật bảng đầu tiên
      const query1 = `
          INSERT INTO role (TenDangNhap, MaPhongBan, Quyen, isKhoa)
          VALUES (?, ?, ?, ?)
      `;
      await connection.query(query1, [
        TenDangNhap,
        MaPhongBan,
        Quyen,
        isKhoa ? 1 : 0,
      ]);

      res.redirect("/thongTinTK?Success");
    } catch (error) {
      console.error("Lỗi khi cập nhật dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể cập nhật dữ liệu");
    } finally {
      await connection.end(); // Đóng kết nối
    }
  },

  getNhanVien: (req, res) => {
    res.render("nhanVien", { title: "Danh sách nhân viên" });
  },

  // phần hiển thị danh sách
  getListNhanVien: async (req, res) => {
    try {
      const [rows] = await connection
        .promise()
        .query(
          "SELECT id_User, MaNhanVien, TenNhanVien, MaPhongBan FROM nhanvien"
        );
      res.json(rows);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      res
        .status(500)
        .json({ message: "Đã xảy ra lỗi khi lấy danh sách nhân viên" });
    }
  },
  getPhongBan: (req, res) => {
    res.render("phongBan", { title: "Danh sách phòng ban" });
  },

  getListPhongBan: async (req, res) => {
    try {
      console.log("Đang truy vấn danh sách phòng ban...");
      const [rows] = await connection
        .promise()
        .query("SELECT maPhongBan, tenPhongBan, ghiChu, isKhoa FROM phongban");
      console.log("Kết quả truy vấn:", rows);
      res.json(rows);
    } catch (error) {
      console.error("Lỗi chi tiết khi lấy danh sách phòng ban:", error);
      res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy danh sách phòng ban",
        error: error.message,
      });
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
      const query2 = "SELECT * FROM phongban";
      const [results2] = await connection.query(query2);
      let departmentLists = results2; // Gán kết quả vào departmentLists

      // Render trang với 2 biến: value và departmentLists
      res.render("updateNV.ejs", {
        value: user,
        departmentLists: departmentLists,
      });
    } catch (error) {
      console.error("Lỗi: ", error);
      res.status(500).send("Đã có lỗi xảy ra");
    }
  },
  getUpdateTK: async (req, res) => {
    try {
      const TenDangNhap = req.params.TenDangNhap;

      // Lấy dữ liệu tài khoản
      const connection = await createConnection();
      const query1 = "SELECT * FROM `taikhoannguoidung` WHERE TenDangNhap = ?";
      const [results1] = await connection.query(query1, [TenDangNhap]);
      let accountList = results1 && results1.length > 0 ? results1[0] : {};

      // Lấy dữ liệu phòng ban
      const query2 = "SELECT * FROM phongban";
      const [results2] = await connection.query(query2);
      let departmentLists = results2; // Gán kết quả vào departmentLists

      // Lấy dữ liệu nhân viên
      const id_User = accountList.id_User;
      const query3 = "SELECT * FROM nhanvien WHERE id_User = ?";
      const [results3] = await connection.query(query3, [id_User]);
      id = results3 && results3.length > 0 ? results3[0] : {}; // Gán kết quả đầu tiên nếu có

      //Lấy dữ liệu bảng nhân viên
      const query4 = "SELECT * FROM nhanvien";
      const [results4] = await connection.query(query4);
      let user = results4; // Gán kết quả vào user

      //Lấy dữ liệu quyền
      const query5 = "SELECT * FROM `role` WHERE TenDangNhap = ?";
      const [results5] = await connection.query(query5, [TenDangNhap]);
      let role = results5 && results5.length > 0 ? results5[0] : {};

      // Render trang với 2 biến: value và departmentLists
      res.render("updateTK.ejs", {
        accountList: accountList,
        departmentLists: departmentLists,
        user: user,
        id: id,
        role: role,
      });
    } catch (error) {
      console.error("Lỗi: ", error);
      res.status(500).send("Đã có lỗi xảy ra");
    }
  },

  // Other methods can be added here as needed...
};

module.exports = AdminController; // Export the entire controller
