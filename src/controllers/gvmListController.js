//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

let gvmLists;
const getGvmList = async (req, res) => {
  // const query = `select id_GVM, HoTen, NgaySinh from gvmoi`;
  const query = `select * from gvmoi`;
  // connection.query(query, function (err, results) {
  //   // console.log("kqua o trong", results);
  //   gvmLists = results;
  //   res.render("gvmList.ejs", { gvmLists: results });
  // });
  const connection = await createConnection();

  const [results, fields] = await connection.query(query);
  gvmLists = results;
  res.render("gvmList.ejs", { gvmLists: results });
};

// const getGvm = (req, res) => {
//   res.json(gvmLists);
// };

const getGvm = async (req, res) => {
  try {
    res.json(gvmLists); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching GVM list:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  getGvmList,
  getGvm,
};
