//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

// const getClassInfoGvm = async (req, res) => {
//   let query;
//   const role = req.session.role;
//   const MaPhongBan = req.session.MaPhongBan;
//   const isKhoa = req.session.isKhoa;
//   //const parts = role.split("_");
//   // if (isKhoa == 0) {
//   //   query = `SELECT * from giangday JOIN gvmoi
//   //   on giangday.id_Gvm = gvmoi.id_Gvm`;
//   //   //ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
//   // } else {
//   //   query = `SELECT *
//   //   FROM giangday
//   //   JOIN gvmoi ON giangday.id_Gvm = gvmoi.id_Gvm
//   //   WHERE MaHocPhan LIKE '${MaPhongBan}%'`;
//   // }

//   if (isKhoa == 0) {
//     query = `
//     SELECT
//     *
//     FROM quychuan
//     JOIN gvmoi
//     ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen;
//     `;

//     //ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
//   } else {
//     query = `SELECT *
//     FROM quychuan
//     JOIN gvmoi ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen
//     WHERE MaHocPhan LIKE '${MaPhongBan}%'`;
//   }

//   const connection = await createConnection();
//   const [results, fields] = await connection.query(query);

//   const groupedByTeacher = results.reduce((acc, current) => {
//     const teacher = current.GiaoVienGiangDay;
//     if (!acc[teacher]) {
//       acc[teacher] = [];
//     }
//     acc[teacher].push(current);
//     return acc;
//   }, {});

//   res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
// };

//Lấy danh sách giảng viên mời để show chi tiết

const getClassInfoGvm = async (req, res) => {
  let query;
  const role = req.session.role;
  const MaPhongBan = req.session.MaPhongBan;
  const isKhoa = req.session.isKhoa;

  if (isKhoa == 0) {
    query = `
    SELECT 
    *
    FROM quychuan
    JOIN gvmoi 
    ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen;
    `;
  } else {
    query = `SELECT * 
    FROM quychuan 
    JOIN gvmoi ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen
    WHERE MaHocPhan LIKE '${MaPhongBan}%'`;
  }

  const connection = await createConnection();

  try {
    const [results, fields] = await connection.query(query);

    // Nhóm các môn học theo giảng viên
    const groupedByTeacher = results.reduce((acc, current) => {
      const teacher = current.GiaoVienGiangDay;
      if (!acc[teacher]) {
        acc[teacher] = [];
      }
      acc[teacher].push(current);
      return acc;
    }, {});

    res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
  } catch (error) {
    console.error("Error fetching class info:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await connection.end(); // Đóng kết nối sau khi hoàn thành hoặc gặp lỗi
  }
};

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

// Xuất các hàm để sử dụng trong router
module.exports = {
  getClassInfoGvm,
  getGvm,
};
