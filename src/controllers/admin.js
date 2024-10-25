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
      query = 'SELECT nhanvien.TenNhanVien, taikhoannguoidung.TenDangNhap, taikhoannguoidung.id_User, taikhoannguoidung.matkhau, role.Quyen, nhanvien.MaPhongBan, role.isKhoa FROM taikhoannguoidung INNER JOIN nhanvien ON taikhoannguoidung.id_User = nhanvien.id_User INNER JOIN role ON taikhoannguoidung.TenDangNhap = role.TenDangNhap ORDER BY taikhoannguoidung.id_User ASC'; // Truy vấn lấy tất cả người dùng  
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

  const getnhanvienList = async (req, res) => {
    try {
      query = 'SELECT nhanvien.id_User, nhanvien.GioiTinh , nhanvien.MaNhanVien, nhanvien.TenNhanVien,  nhanvien.MaPhongBan, nhanvien.ChucVu, nhanvien.MonGiangDayChinh, nhanvien.DienThoai, nhanvien.CCCD, nhanvien.NgayCapCCCD, nhanvien.NoiCapCCCD, nhanvien.HocVi, phongban.TenPhongBan, taikhoannguoidung.TenDangNhap, taikhoannguoidung.MatKhau  From nhanvien LEFT JOIN taikhoannguoidung ON nhanvien.id_User = taikhoannguoidung.id_User LEFT JOIN phongban ON nhanvien.MaPhongBan = phongban.MaPhongBan  ORDER BY nhanvien.id_User ASC'; // Truy vấn lấy tất cả người dùng  
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
  const getchangePassword = async (req, res) => {
    try {
        // Lấy TenDangNhap từ query parameters
        const tenDangNhap = req.query.tenDangNhap;

        // Kiểm tra xem TenDangNhap có tồn tại không
        if (!tenDangNhap) {
            return res.status(400).send("Thiếu tham số TenDangNhap");
        }

        // Truy vấn lấy thông tin người dùng
        const query = 'SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?'; // Sử dụng tham số để tránh SQL Injection
        const connection = await createConnection(); // Kết nối tới cơ sở dữ liệu
        
        const [results] = await connection.query(query, [tenDangNhap]); // Thực hiện truy vấn
        
        if (results.length === 0) {
            return res.status(404).send("Không tìm thấy tài khoản với TenDangNhap đã cho");
        }
        
        const account = results[0]; // Lấy thông tin tài khoản đầu tiên (giả sử TenDangNhap là duy nhất)
  
        // Render trang changePassword.ejs và truyền thông tin tài khoản vào
        res.render("changePassword.ejs", { account: account });
    } catch (error) {
        console.error("Lỗi khi lấy trang đổi mật khẩu:", error);
        res.status(500).send("Lỗi hệ thống");
    }
}
const updatePassword = async (req, res) => {
  try {
      const { currentPassword, newPassword } = req.body;
      const tenDangNhap = req.query.tenDangNhap;

      // Kiểm tra xem TenDangNhap có tồn tại không
      if (!tenDangNhap) {
          return res.status(400).send("Thiếu tham số TenDangNhap");
      }

      // Truy vấn lấy tài khoản từ CSDL
      const query = 'SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?';
      const connection = await createConnection();
      const [results] = await connection.query(query, [tenDangNhap]);

      if (results.length === 0) {
          return res.status(404).send("Tài khoản không tồn tại");
      }

      const account = results[0];

      // So sánh mật khẩu nhập vào với mật khẩu trong CSDL
      if (account.password !== currentPassword) {
          return res.status(401).send("Mật khẩu hiện tại không đúng");
      }

      // Cập nhật mật khẩu mới
      const updateQuery = 'UPDATE taikhoannguoidung SET password = ? WHERE TenDangNhap = ?';
      await connection.query(updateQuery, [newPassword, tenDangNhap]);

      res.send("Cập nhật mật khẩu thành công");
  } catch (error) {
      console.error("Lỗi khi cập nhật mật khẩu:", error);
      res.status(500).send("Lỗi hệ thống");
  }
};



  
  module.exports = {
    getaccountList,
    getdepartmentList,
    getnhanvienList,
    getMaPhongBanList,
    getidUserLists,
    getUpdatePhongBan,
    getchangePassword,
    updatePassword,
  };