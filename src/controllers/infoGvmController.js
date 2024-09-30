const XLSX = require('xlsx');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const connection = require('../controllers/connectDB');

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
      suffix: match[2] || '', // Phân lớp (.1, .2,...)
    };
  }
  return { baseClass: lop, suffix: '' }; // Nếu không có phân lớp
}

// Hàm gộp các học phần trùng
function handleDuplicateCourses(firstCourse, courses) {
  const totalLL = courses.reduce((sum, course) => sum + course.LL, 0);
  const totalSoTietCTDT = courses.reduce((sum, course) => sum + course.SoTietCTDT, 0);
  const totalQuyChuan = courses.reduce((sum, course) => sum + course.QuyChuan, 0);

  return {
    ...firstCourse,
    LL: totalLL,
    SoTietCTDT: totalSoTietCTDT,
    QuyChuan: totalQuyChuan,
  };
}

// Cập nhật hàm renderInfo để xử lý việc gộp các lớp phân lớp
const renderInfo = (req, res) => {
  const tableName = process.env.DB_TABLE_NAME;

  const query = `SELECT * FROM ${tableName}`;
  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    const courseMap = {};

    results.forEach(row => {
      const teacher = row.GiaoVien;

      const courseData = {
        ...tachChuoi(row.LopHocPhan),
        LL: row.LL,
        SoTietCTDT: row.SoTietCTDT,
        QuyChuan: row.QuyChuan,
        ...row,
      };

      const { baseClass, suffix } = extractClassSuffix(courseData.Lop); // Tách lớp chính và phân lớp

      // Khởi tạo courseMap theo giáo viên nếu chưa có
      if (!courseMap[teacher]) {
        courseMap[teacher] = {};
      }

      // Kiểm tra lớp học chính trong courseMap của giáo viên
      if (!courseMap[teacher][baseClass]) {
        courseMap[teacher][baseClass] = [];
      }

      // Thêm các lớp phân lớp vào cùng một nhóm dựa trên lớp chính (baseClass)
      courseMap[teacher][baseClass].push({ ...courseData, suffix });
    });

    const finalResults = [];

    // Duyệt qua từng giáo viên và từng lớp học
    for (const teacher in courseMap) {
      for (const baseClass in courseMap[teacher]) {
        const courses = courseMap[teacher][baseClass];

        // Nếu có nhiều lớp phân lớp (.1, .2,...), gộp lại thành một lớp
        if (courses.length > 1) {
          const mergedCourse = handleDuplicateCourses(courses[0], courses);
          finalResults.push(mergedCourse); // Thêm lớp đã gộp
        } else {
          finalResults.push(courses[0]); // Thêm lớp duy nhất nếu không có phân lớp
        }
      }
    }

    return res.status(200).json(finalResults); // Trả về kết quả sau khi gộp
  });
};

module.exports = { renderInfo };
