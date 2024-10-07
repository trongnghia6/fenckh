
const XLSX = require('xlsx');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const connection = require('../controllers/connectDB');
const { json } = require('express');

// Hàm chuyển đổi tệp Excel sang JSON
const convertExcelToJSON = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.unlinkSync(filePath); // Xóa tệp sau khi xử lý
    const data = worksheet;

    // Lấy tiêu đề từ đối tượng đầu tiên
    const header = data[0];
    const keys = Object.keys(header);
    const dataObjects = data.slice(1);

    // Tạo danh sách các đối tượng JSON với các khóa từ tiêu đề
    const jsonObjects = dataObjects.map((values) => {
      return keys.reduce((acc, key) => {
        acc[header[key]] = values[key];
        return acc;
      }, {});
    });
    return jsonObjects;
  } catch (err) {
    throw new Error('Cannot read file!: ' + err.message);
  }
};

// Hàm nhập dữ liệu vào bảng quychuan
const importTableQC = async (jsonData) => {
  const tableName = process.env.DB_TABLE_NAME; // Giả sử biến này có giá trị là "quychuan"

  // Tạo câu lệnh INSERT động
  const query = `
    INSERT INTO ${tableName} (
      GiaoVien, 
      GiaoVienGiangDay, 
      MoiGiang, 
      SoTinChi, 
      LopHocPhan, 
      LL, 
      SoTietCTDT, 
      HeSoT7CN, 
      SoSinhVien, 
      HeSoLopDong, 
      QuyChuan, 
      GhiChu
    ) VALUES (?, NULL, FALSE, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const insertPromises = jsonData.map(item => {
    return new Promise((resolve, reject) => {
      const values = [
        item['Giáo Viên'],                          // Tên giáo viên
        item['Số TC'],                               // Số tín chỉ
        item['Lớp học phần'],                        // Lớp học phần                     
        item['Số tiết lên lớp theo TKB'],          // LL (cần xác định từ dữ liệu nếu cần)
        item['Số tiết theo CTĐT'],                  // Số tiết CTĐT
        item['Hệ số lên lớp ngoài giờ HC/ Thạc sĩ/ Tiến sĩ'], // Hệ số T7/CN
        item['Số SV'],                               // Số sinh viên
        item['Hệ số lớp đông'],                     // Hệ số lớp đông
        item['QC'],                                  // Quy chuẩn
        item['Ghi chú']                              // Ghi chú
      ];

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error('Error:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  });

  let results = false;
  try {
    await Promise.all(insertPromises);
    results = true;
  } catch (error) {
    console.error('Error:', error);
  }

  return results;
};

const importJSONToDB = async (jsonData) => {
  const tableLopName = 'lop'; // Tên bảng lop
  const tableHocPhanName = 'hocphan'; // Tên bảng hocphan
  const tableGiangDayName = 'giangday'; // Tên bảng giangday

  // Các cột cho bảng lop
  const columnMaLop = 'MaLop'; // Mã lớp
  const columnTenLop = 'TenLop'; // Tên lớp
  const columnSoSinhVien = 'SoSinhVien'; // Số sinh viên
  const columnNam = 'NamHoc'; // Năm học
  const columnHocKi = 'HocKi'; // Học kỳ
  const columnHeSoSV = 'HeSoSV'; // Hệ số sinh viên

  // Các cột cho bảng hocphan
  const columnMaHocPhan = 'MaHocPhan'; // Mã học phần
  const columnTenHocPhan = 'TenHocPhan'; // Tên học phần
  const columnDVHT = 'DVHT'; // Số tín chỉ

  // Các cột cho bảng giangday
  const columnIdUser = 'id_User'; // ID giáo viên
  const columnMaHocPhanGiangDay = 'MaHocPhan'; // Mã học phần
  const columnMaLopGiangDay = 'MaLop'; // Mã lớp
  const columnIdGVM = 'Id_Gvm'; // ID giảng viên mời
  const columnGiaoVien = 'GiaoVien'; // Tên giáo viên
  const columnLenLop = 'LenLop'; // LL
  const columnHeSoT7CN = 'HeSoT7CN'; // Hệ số T7/CN
  const columnSoTietCTDT = 'SoTietCTDT'; // Số tiết CTĐT

  function tachChuoi(chuoi) {
    // Tách chuỗi bằng dấu "-" để lấy các phần
    const parts = chuoi.split("-");

    // Lấy phần đầu tiên và phần thứ hai, dừng lại trước cặp ngoặc
    const tenHP = parts[0].trim(); // Tên học phần
    const HocKi = parts[1] ? parts[1].trim() : ""; // Học kỳ
    const namHocLop = parts[2] ? parts[2].split("(")[0].trim() : ""; // Lấy năm học kèm lớp, dừng trước ngoặc

    const NamHoc = "20" + namHocLop.substring(0, 2).trim(); // Lấy 2 ký tự đầu của năm học
    const LopMatch = chuoi.match(/\(([^)]+)\)/); // Tìm lớp trong ngoặc
    const Lop = LopMatch ? LopMatch[1] : ""; // Nếu tìm thấy, lấy lớp, nếu không để rỗng

    return {
      TenLop: tenHP,
      HocKi: HocKi,
      NamHoc,
      Lop,
    };
  }

  const getIdUserByTeacherName = async (teacherName) => {
    return new Promise((resolve, reject) => {
      // Sử dụng cú pháp truy vấn đơn giản
      const query = `SELECT id_User FROM nhanvien WHERE TenNhanVien = '${teacherName}';`;

      connection.query(query, (err, results) => {
        if (err) {
          console.error('Lỗi khi truy vấn bảng nhanvien:', err);
          reject(err);
          return;
        }

        // Nếu không tìm thấy giáo viên
        if (results.length === 0) {
          resolve(null); // Không tìm thấy, trả về null
        } else {
          resolve(results[0].id_User); // Lấy id_User của giáo viên
        }
      });
    });
  };



  let index = 1;

  const insertPromises = jsonData.map(async item => {
    const chuoi = item['Lớp học phần'];
    const { TenLop, HocKi, NamHoc, Lop } = tachChuoi(chuoi);
    const tenGv = item['Giáo Viên'];
    const id_User = await getIdUserByTeacherName(tenGv); // Chờ lấy id_User

    // // Tách lớp học phần
    // console.log('test');
    // console.log(TenLop);
    // console.log(HocKi);
    // console.log(NamHoc);
    // console.log(Lop);


    if (id_User != null) {
      const insertLopPromise = new Promise((resolve, reject) => {
        const queryLop = `INSERT INTO ${tableLopName} 
          (${columnMaLop}, ${columnTenLop}, ${columnSoSinhVien}, ${columnNam}, ${columnHocKi}, ${columnHeSoSV}) 
          VALUES (?, ?, ?, ?, ?, ?)`;

        connection.query(queryLop, [
          index,                                  // Mã lớp đã tách
          TenLop,                               // Tên lớp
          item['Số SV'],                   // Số sinh viên từ JSON
          NamHoc,                               // Năm học
          HocKi,                                // Học kỳ
          item['Hệ số lớp đông']                        // Hệ số sinh viên từ JSON
        ], (err, results) => {
          if (err) {
            console.error('Lỗi khi thêm vào bảng lop:', err);
            reject(err);
            return;
          }
          resolve(results);
        });
      });

      const insertHocPhanPromise = new Promise((resolve, reject) => {
        const queryHocPhan = `INSERT INTO ${tableHocPhanName} 
          (${columnMaHocPhan}, ${columnTenHocPhan}, ${columnDVHT}) 
          VALUES (?, ?, ?)`;

        connection.query(queryHocPhan, [
          index,                                  // Mã học phần là mã lớp đã tách
          TenLop,                               // Tên học phần là tên lớp
          item['Số TC']                     // DVHT là số tín chỉ
        ], (err, results) => {
          if (err) {
            console.error('Lỗi khi thêm vào bảng hocphan:', err);
            reject(err);
            return;
          }
          resolve(results);
        });
      });

      const insertGiangDayPromise = new Promise((resolve, reject) => {
        const queryGiangDay = `INSERT INTO ${tableGiangDayName} 
          (${columnIdUser}, ${columnMaHocPhanGiangDay}, ${columnMaLopGiangDay}, ${columnIdGVM}, ${columnGiaoVien}, ${columnLenLop}, ${columnHeSoT7CN}, ${columnSoTietCTDT}) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(queryGiangDay, [
          id_User,                               // ID giáo viên
          index,                                   // Mã học phần
          index,                                     // mã lớp
          index,                                   // id gvm
          item['Giáo Viên'],                    // Tên giáo viên
          item['LL'],                         // LL
          item['Hệ số T7/CN'],                     // Hệ số T7/CN
          item['Số tiết CTĐT']                    // Số tiết CTĐT
        ], (err, results) => {
          if (err) {
            console.error('Lỗi khi thêm vào bảng giangday:', err);
            reject(err);
            return;
          }
          resolve(results);
        });
      });

      index++; // Tăng index sau khi hoàn thành các thao tác với item hiện tại
      return Promise.all([insertLopPromise, insertHocPhanPromise, insertGiangDayPromise]);
    }
  });


  try {
    await Promise.all(insertPromises);
    results = true;
  } catch (error) {
    console.error('Lỗi tổng quát:', error);
    results = false;
  }


  return results;
};




const handleUploadAndRender = async (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.file.filename);

  // Chuyển đổi file Excel sang JSON
  const jsonResult = convertExcelToJSON(filePath);

  // render bảng
  res.send(jsonResult);

};

module.exports = { handleUploadAndRender, importJSONToDB, importTableQC };
