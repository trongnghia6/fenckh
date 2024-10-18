const express = require('express');
const createConnection = require("../config/databaseAsync");
const router = express.Router();
const mysql = require('mysql2/promise');
const app = express();

let accountLists;
let departmentLists;
let nhanvienLists;
let idUserLists;
let query;
const getaccountList = async (req, res) => {
    try {
      query = 'SELECT taikhoannguoidung.TenDangNhap, taikhoannguoidung.id_User, taikhoannguoidung.matkhau, role.Quyen, nhanvien.MaPhongBan, role.isKhoa FROM taikhoannguoidung INNER JOIN nhanvien ON taikhoannguoidung.id_User = nhanvien.id_User INNER JOIN role ON taikhoannguoidung.TenDangNhap = role.TenDangNhap ORDER BY taikhoannguoidung.id_User ASC'; // Truy vấn lấy tất cả người dùng  
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
      const [results, fields] = await connection.query(query); // Thực hiện truy vấn
      accountLists = results; // Gán kết quả vào accountLists
  
      // Render trang thongTinTK.ejs và truyền danh sách tài khoản vào
      res.render("thongTinTK.ejs", { accountLists: accountLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  const getphanQuyen = async (req, res) => {
    try {
      const accountQuery = 'SELECT * FROM taikhoannguoidung'; // Câu truy vấn cho tài khoản
        const departmentQuery = 'SELECT * FROM phongban'; // Câu truy vấn cho phòng ban

        const connection = await createConnection();

        const [accountResults] = await connection.query(accountQuery);
        const [departmentResults] = await connection.query(departmentQuery);

        // Render trang phanQuyen.ejs và truyền cả hai danh sách vào
        res.render("phanQuyen.ejs", {
            accountList: accountResults,
            departmentList: departmentResults
        });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  const getnhanvienList = async (req, res) => {
    try {
      query = 'SELECT nhanvien.id_User, nhanvien.MaNhanVien, nhanvien.TenNhanVien, nhanvien.GioiTinh, nhanvien.MaPhongBan, nhanvien.ChucVu, nhanvien.MonGiangDayChinh, nhanvien.DienThoai, nhanvien.CCCD, nhanvien.NgayCapCCCD, nhanvien.NoiCapCCCD, nhanvien.HocVi, phongban.TenPhongBan, taikhoannguoidung.TenDangNhap, taikhoannguoidung.MatKhau  From nhanvien INNER JOIN taikhoannguoidung ON nhanvien.id_User = taikhoannguoidung.id_User INNER JOIN phongban ON nhanvien.MaPhongBan = phongban.MaPhongBan ORDER BY nhanvien.id_User ASC'; // Truy vấn lấy tất cả người dùng  
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
      const [results, fields] = await connection.query(query); // Thực hiện truy vấn
      nhanvienLists = results; // Gán kết quả vào nhanvienLists
  
      // Render trang nhanVien.ejs và truyền danh sách tài khoản vào
      res.render("nhanVien.ejs", { nhanvienLists: nhanvienLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  const getdepartmentList = async (req, res) => {
    try {
      query = 'SELECT * FROM phongban'; // Truy vấn lấy tất cả người dùng  
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
      const [results, fields] = await connection.query(query); // Thực hiện truy vấn
      departmentLists = results; // Gán kết quả vào departmentLists
  
      // Render trang phongBan.ejs và truyền danh sách tài khoản vào
      res.render("phongBan.ejs", { departmentLists: departmentLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  const getMaPhongBanList = async (req, res) => {
    try {
      query = 'SELECT * FROM phongban'; // Truy vấn lấy tất cả người dùng  
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
      const [results, fields] = await connection.query(query); // Thực hiện truy vấn
      departmentLists = results; // Gán kết quả vào departmentLists
  
      // Render trang phongBan.ejs và truyền danh sách tài khoản vào
      res.render("themnhanVien.ejs", { departmentLists: departmentLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  const getUpdatePhongBan = async (req, res) => {
    try {
      const MaPhongBan = req.params.MaPhongBan; // Lấy MaPhongBan từ request body hoặc có thể từ params
  
      const query = 'SELECT * FROM phongban WHERE MaPhongBan = ?'; // Truy vấn lấy dữ liệu từ bảng phongban
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
  
      // Thực hiện truy vấn và truyền giá trị MaPhongBan
      const [results, fields] = await connection.query(query, [MaPhongBan]); 
  
      const departmentLists = results[0]; // Gán kết quả truy vấn vào departmentLists
  
      // Render trang updatePB.ejs và truyền danh sách phòng ban vào
      res.render("updatePB.ejs", { departmentLists: departmentLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  };
  
  const getidUserLists = async (req, res) =>{
    try {
      query = 'SELECT * FROM nhanvien'; // Truy vấn lấy tất cả người dùng  
      const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
      const [results, fields] = await connection.query(query); // Thực hiện truy vấn
      idUserLists = results; // Gán kết quả vào idUserLists
  
      // Render trang phongBan.ejs và truyền danh sách tài khoản vào
      res.render("themTK.ejs", { idUserLists: idUserLists });
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ cơ sở dữ liệu: ", error);
      res.status(500).send("Lỗi server, không thể lấy dữ liệu");
    }
  }
  

  module.exports = {
    getaccountList,
    getdepartmentList,
    getnhanvienList,
    getMaPhongBanList,
    getidUserLists,
    getphanQuyen,
    getUpdatePhongBan,
  };