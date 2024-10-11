const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

let gvmLists;
let query;
const getGvmList = async (req, res) => {
  const role = req.session.role;
  const parts = role.split("_");
  if (role.includes("DAOTAO")) {
    query = `select * from gvmoi`;
  } else {
    query = `SELECT * FROM gvmoi WHERE MaPhongBan = '${parts[0]}'`;
  }

  const connection = await createConnection();

  const [results, fields] = await connection.query(query);
  gvmLists = results;
  res.render("gvmList.ejs", { gvmLists: results });
};

const getGvm = async (req, res) => {
  try {
    res.json(gvmLists); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// // Khoa công nghệ thông tin
// const getGvmListCNTT = async (req, res) => {
//   const query = `select * from gvmoi where MaPhongBan = 'CNTT'`;

//   const connection = await createConnection();

//   const [results, fields] = await connection.query(query);
//   gvmLists = results;
//   res.render("KhoaCNTT/KhoaCnttMain.ejs", { gvmLists: results });
// };

// // const getGvm = (req, res) => {
// //   res.json(gvmLists);
// // };

// const getGvmCNTT = async (req, res) => {
//   try {
//     res.json(gvmLists); // Trả về danh sách giảng viên mời
//   } catch (error) {
//     console.error("Error fetching GVM list:", error);
//     res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
//   }
// };

// Xuất các hàm để sử dụng trong router
module.exports = {
  getGvmList,
  getGvm,
  // Khoa công nghệ thông tin
  // getGvmListCNTT,
  // getGvmCNTT,
};
