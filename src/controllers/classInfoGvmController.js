//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

// const getClassInfoGvm = async (req, res) => {
//   const query = `select * from quychuan`;

//   const connection = await createConnection();

//   const [results, fields] = await connection.query(query);
//   //gvmLists = results;

//   res.render("classInfoGvm.ejs", { GiangDay: results });
// };

// const getClassInfoGvm = async (req, res) => {
//   const query = `SELECT * FROM quychuan ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
//   const connection = await createConnection();
//   const [results, fields] = await connection.query(query);

//   // Nhóm các môn học theo giảng viên
//   const groupedByTeacher = results.reduce((acc, current) => {
//     const teacher = current.GiaoVien;
//     if (!acc[teacher]) {
//       acc[teacher] = [];
//     }
//     acc[teacher].push(current);
//     return acc;
//   }, {});

//   // Phần show chi tiết giảng viên mời
//   const query2 = `select * from gvmoi`;

//   //const connection = await createConnection();

//   const [results2, fields2] = await connection.query(query2);

//   console.log(results2);
//   // res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
//   res.render("classInfoGvm.ejs", {
//     GiangDay: groupedByTeacher,
//     gvmLists: results2,
//   });
// };

const getClassInfoGvm = async (req, res) => {
  const query = `SELECT * from quychuan JOIN gvmoi
                on quychuan.GiaoVien = gvmoi.HoTen 
                ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
  const connection = await createConnection();
  const [results, fields] = await connection.query(query);

  // Nhóm các môn học theo giảng viên
  const groupedByTeacher = results.reduce((acc, current) => {
    const teacher = current.GiaoVien;
    if (!acc[teacher]) {
      acc[teacher] = [];
    }
    acc[teacher].push(current);
    return acc;
  }, {});

  res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
};

// Lấy danh sách giảng viên mời để show chi tiết
const getGvm = async (req, res) => {
  const query2 = `select * from gvmoi`;

  const connection2 = await createConnection();

  const [results2, fields2] = await connection2.query(query2);
  try {
    res.json(results2); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// Khoa công nghệ thông tin =================================
const getClassInfoGvmCNTT = async (req, res) => {
  const query = `SELECT * from quychuan JOIN gvmoi
                on quychuan.GiaoVien = gvmoi.HoTen
                WHERE gvmoi.MaPhongBan = 'CNTT'
                ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
  const connection = await createConnection();
  const [results, fields] = await connection.query(query);

  // Nhóm các môn học theo giảng viên
  const groupedByTeacher = results.reduce((acc, current) => {
    const teacher = current.GiaoVien;
    if (!acc[teacher]) {
      acc[teacher] = [];
    }
    acc[teacher].push(current);
    return acc;
  }, {});

  res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
};

// Lấy danh sách giảng viên mời để show chi tiết
const getGvmCNTT = async (req, res) => {
  const query2 = `select * from gvmoi where MaPhongBan = 'CNTT'`;

  const connection2 = await createConnection();

  const [results2, fields2] = await connection2.query(query2);
  try {
    res.json(results2); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  getClassInfoGvm,
  getGvm,

  // Khoa công nghệ thông tin
  getClassInfoGvmCNTT,
  getGvmCNTT,
};
