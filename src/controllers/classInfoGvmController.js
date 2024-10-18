//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

const getClassInfoGvm = async (req, res) => {
  let query;
  const role = req.session.role;
  const MaPhongBan = req.session.MaPhongBan;
  const isKhoa = req.session.isKhoa;
  //const parts = role.split("_");
  // if (isKhoa == 0) {
  //   query = `SELECT * from giangday JOIN gvmoi
  //   on giangday.id_Gvm = gvmoi.id_Gvm`;
  //   //ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
  // } else {
  //   query = `SELECT *
  //   FROM giangday
  //   JOIN gvmoi ON giangday.id_Gvm = gvmoi.id_Gvm
  //   WHERE MaHocPhan LIKE '${MaPhongBan}%'`;
  // }

  if (isKhoa == 0) {
    query = `
    SELECT 
    *
    FROM quychuan
    JOIN gvmoi 
    ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen;
    `;

    //ORDER BY GiaoVien`; // Sắp xếp theo tên giảng viên
  } else {
    query = `SELECT * 
    FROM quychuan 
    JOIN gvmoi ON SUBSTRING_INDEX(quychuan.GiaoVienGiangDay, '-', 1) = gvmoi.HoTen
    WHERE MaHocPhan LIKE '${MaPhongBan}%'`;
  }

  const connection = await createConnection();
  const [results, fields] = await connection.query(query);
  //console.log("danh sách = ", results);
  // Nhóm các môn học theo giảng viên
  const groupedByTeacher = results.reduce((acc, current) => {
    const teacher = current.GiaoVienGiangDay;
    if (!acc[teacher]) {
      acc[teacher] = [];
    }
    acc[teacher].push(current);
    return acc;
  }, {});
  console.log("ds = ", groupedByTeacher);

  res.render("classInfoGvm.ejs", { GiangDay: groupedByTeacher });
};

//Lấy danh sách giảng viên mời để show chi tiết
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

// const getSampleClassInfoGvm = async (req, res) => {
//   console.log('Dữ liệu được truyền đến view:', classInfoGvm);

//   const classInfoGvm = [];

//   // Thông tin tự nghĩ về các lớp giảng viên
//   classInfoGvm.push({
//     GiaoVien: "Nguyễn Văn A",
//     LopHocPhan: "Toán Cao Cấp",
//     Lop: "TC101",
//     SoTinChi: 3,
//     QuyChuan: 45,
//     id_Gvm: 1,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Nguyễn Văn A",
//     LopHocPhan: "Vật Lý Đại Cương",
//     Lop: "VL201",
//     SoTinChi: 4,
//     QuyChuan: 60,
//     id_Gvm: 2,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Trần Thị B",
//     LopHocPhan: "Hóa Học Cơ Bản",
//     Lop: "HH301",
//     SoTinChi: 3,
//     QuyChuan: 45,
//     id_Gvm: 3,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Trần Thị B",
//     LopHocPhan: "Lập Trình C++",
//     Lop: "LT401",
//     SoTinChi: 4,
//     QuyChuan: 60,
//     id_Gvm: 4,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Lê Đức C",
//     LopHocPhan: "Cơ Sở Dữ Liệu",
//     Lop: "CSDL501",
//     SoTinChi: 3,
//     QuyChuan: 45,
//     id_Gvm: 5,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Lê Đức C",
//     LopHocPhan: "Mạng Máy Tính",
//     Lop: "MMT601",
//     SoTinChi: 4,
//     QuyChuan: 60,
//     id_Gvm: 6,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Phạm Thị D",
//     LopHocPhan: "An Toàn Thông Tin",
//     Lop: "ATT701",
//     SoTinChi: 3,
//     QuyChuan: 45,
//     id_Gvm: 7,
//   });

//   classInfoGvm.push({
//     GiaoVien: "Phạm Thị D",
//     LopHocPhan: "Kỹ Thuật Mạng",
//     Lop: "KTM801",
//     SoTinChi: 4,
//     QuyChuan: 60,
//     id_Gvm: 8,
//   });

//   // Sử dụng mảng classInfoGvm để hiển thị thông tin các lớp giảng viên
//   res.render("classInfoGvm.ejs", { GiangDay: classInfoGvm });
// };

// Xuất các hàm để sử dụng trong router
module.exports = {
  getClassInfoGvm,
  getGvm,
  // getSampleClassInfoGvm,
  // Khoa công nghệ thông tin
  // getClassInfoGvmCNTT,
  // getGvmCNTT,
};
