const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const connection = require("./connectDB");
const { getEnvironmentData } = require("worker_threads");

// Hàm tách chuỗi - giữ nguyên
function tachChuoi(chuoi) {
  const parts = chuoi.split("-");
  const tenHP = parts[0].trim();
  const HocKi = parts[1] ? parts[1].trim() : "";
  const namHocLop = parts[2] ? parts[2].split("(")[0].trim() : "";
  const NamHoc = "20" + namHocLop.substring(0, 2).trim();
  const LopMatch = chuoi.match(/\(([^)]+)\)/);
  const Lop = LopMatch ? LopMatch[1] : "";
  return {
    TenLop: tenHP,
    HocKi: HocKi,
    NamHoc,
    Lop,
  };
}

// Hàm tách lớp chính và phân lớp (nếu có)
function extractClassSuffix(lop) {
  const match = lop.match(/([A-Z\d]+)(\.\d+)?/); // Tìm lớp chính và phân lớp (.1, .2,...)
  if (match) {
    return {
      baseClass: match[1], // Lớp chính (ví dụ: A18C604)
      suffix: match[2] || "", // Phân lớp (.1, .2,...)
    };
  }
  return { baseClass: lop, suffix: "" }; // Nếu không có phân lớp
}

// Hàm gộp các học phần trùng
function handleDuplicateCourses(firstCourse, courses) {
  const totalLL = courses.reduce((sum, course) => sum + course.LL, 0);
  const totalSoTietCTDT = courses.reduce(
    (sum, course) => sum + course.SoTietCTDT,
    0
  );
  const totalQuyChuan = courses.reduce(
    (sum, course) => sum + course.QuyChuan,
    0
  );

  return {
    ...firstCourse,
    LL: totalLL,
    SoTietCTDT: totalSoTietCTDT,
    QuyChuan: totalQuyChuan,
  };
}

// Cập nhật hàm renderInfo để xử lý việc gộp các lớp phân lớp
// const renderInfo = (req, res) => {
//   const tableName = process.env.DB_TABLE_QC;

//   const query = `SELECT * FROM ${tableName}`;
//   connection.query(query, (error, results) => {
//     if (error) {
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No data found' });
//     }

//     return res.status(200).json(results); // Trả về kết quả sau khi gộp

//     const courseMap = {};

//     results.forEach(row => {
//       const teacher = row.GiaoVien;

//       const courseData = {
//         ...tachChuoi(row.LopHocPhan),
//         LL: row.LL,
//         SoTietCTDT: row.SoTietCTDT,
//         QuyChuan: row.QuyChuan,
//         ...row,
//       };

//       const { baseClass, suffix } = extractClassSuffix(courseData.Lop); // Tách lớp chính và phân lớp

//       // Khởi tạo courseMap theo Giảng viên nếu chưa có
//       if (!courseMap[teacher]) {
//         courseMap[teacher] = {};
//       }

//       // Kiểm tra lớp học chính trong courseMap của Giảng viên
//       if (!courseMap[teacher][baseClass]) {
//         courseMap[teacher][baseClass] = [];
//       }

//       // Thêm các lớp phân lớp vào cùng một nhóm dựa trên lớp chính (baseClass)
//       courseMap[teacher][baseClass].push({ ...courseData, suffix });
//     });

//     const finalResults = [];

//     // Duyệt qua từng Giảng viên và từng lớp học
//     for (const teacher in courseMap) {
//       for (const baseClass in courseMap[teacher]) {
//         const courses = courseMap[teacher][baseClass];

//         // Nếu có nhiều lớp phân lớp (.1, .2,...), gộp lại thành một lớp
//         if (courses.length > 1) {
//           const mergedCourse = handleDuplicateCourses(courses[0], courses);
//           finalResults.push(mergedCourse); // Thêm lớp đã gộp
//         } else {
//           finalResults.push(courses[0]); // Thêm lớp duy nhất nếu không có phân lớp
//         }
//       }
//     }
//     console.log(finalResults);
//     return res.status(200).json(finalResults); // Trả về kết quả sau khi gộp
//   });
// };
const renderInfo = (req, res) => {
  const role = req.session.role;
  const { Dot, Ki, Nam } = req.body; // Lấy giá trị khoa, dot, ki từ body của yêu cầu
  const tableName = process.env.DB_TABLE_QC;
  let query = "";

  console.log(Dot, Ki, Nam);
  // Xây dựng câu truy vấn SQL sử dụng các tham số
  if (role == "daotao_thihanh") {
    query = `
    SELECT * FROM ${tableName}
    WHERE Dot = ? AND KiHoc = ? AND NamHoc = ?;
  `;
  } else if (role == "CNTT_ALL") {
    query = `
    SELECT * FROM ${tableName}
    WHERE Dot = ? AND KiHoc = ? AND NamHoc = ? AND Khoa = 'CNTT';
  `;
  } else if (role == "attt_thihanh") {
    query = `
    SELECT * FROM ${tableName}
    WHERE Dot = ? AND KiHoc = ? AND NamHoc = ? AND Khoa = 'ATTT';
  `;
  } else if (role == "dtvt_thihanh") {
    query = `
    SELECT * FROM ${tableName}
    WHERE Dot = ? AND KiHoc = ? AND NamHoc = ? AND Khoa = 'DTVT';
  `;
  }

  // Thực thi câu truy vấn với các tham số an toàn
  connection.query(query, [Dot, Ki, Nam], (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }
    return res.status(200).json(results); // Trả về kết quả tương ứng với đợt, kì, năm
  });
};

// Hàm lấy tất cả tên giảng viên từ cơ sở dữ liệu
const getNameGV = (req, res) => {
  // Truy vấn để lấy danh sách giảng viên mời
  const query = "SELECT DISTINCT TenNhanVien,MaPhongBan FROM nhanvien;";

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No teachers found" });
    }

    // Lấy đầy đủ tên giảng viên từ cột HoTen và trả về kết quả
    return res.status(200).json(results);
  });
};

const getKhoaAndNameGvmOfKhoa = async (req, res) => {
  try {
    // Truy vấn để lấy tất cả các trường HoTen và MaPhongBan từ bảng gvmoi
    const gvmResults = await new Promise((resolve, reject) => {
      const queryGVM = `
        SELECT gvmoi.HoTen, gvmoi.MaPhongBan
        FROM gvmoi;
      `;

      connection.query(queryGVM, (error, results) => {
        if (error) {
          console.error("Lỗi truy vấn cơ sở dữ liệu:", error);
          return reject(
            new Error("Không thể truy xuất dữ liệu từ cơ sở dữ liệu.")
          );
        }
        resolve(results); // Trả về kết quả truy vấn
      });
    });

    // Trả về dữ liệu lấy từ bảng gvmoi
    return res.status(200).json(gvmResults);
  } catch (error) {
    console.error("Lỗi trong hàm getKhoaAndNameGvmOfKhoa:", error);
    return res
      .status(500)
      .json({ error: "Đã xảy ra lỗi trong quá trình xử lý dữ liệu." });
  }
};

const getTeachingInfo1 = (req, res) => {
  res.render("teachingInfo.ejs");
};

const getTeachingInfo2 = (req, res) => {
  res.render("teachingInfo2.ejs");
};

module.exports = {
  renderInfo,
  getNameGV,
  getKhoaAndNameGvmOfKhoa,
  getTeachingInfo1,
  getTeachingInfo2,
};
