//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

const getClassInfoGvm = async (req, res) => {
  let query;
  const role = req.session.role;
  const parts = role.split("_");
  if (role.includes("DAOTAO")) {
    query = `SELECT * from giangday JOIN gvmoi
    on giangday.id_Gvm = gvmoi.id_Gvm`;
    //ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
  } else {
    query = `SELECT * 
    FROM giangday 
    JOIN gvmoi ON giangday.id_Gvm = gvmoi.id_Gvm 
    WHERE MaHocPhan LIKE '${parts[0]}%'`;
  }

  const connection = await createConnection();
  const [results, fields] = await connection.query(query);
  //console.log("danh sách = ", results);
  // Nhóm các môn học theo giảng viên
  const groupedByTeacher = results.reduce((acc, current) => {
    const teacher = current.GiangVien;
    if (!acc[teacher]) {
      acc[teacher] = [];
    }
    acc[teacher].push(current);
    return acc;
  }, {});

  res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
};

// const getGvm = async (req, res) => {
//   try {
//     res.json(gvm); // Trả về danh sách giảng viên mời
//   } catch (error) {
//     console.error("Error fetching GVM list:", error);
//     res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
//   }
// };

//Lấy danh sách giảng viên mời để show chi tiết
const getGvm = async (req, res) => {
  const query2 = `select * from gvmoi`;

  const connection2 = await createConnection();

  const [results2, fields2] = await connection2.query(query2);

  console.log("result2: ", results2);
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
  // getClassInfoGvmCNTT,
  // getGvmCNTT,
};
