
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

    console.log(jsonObjects);

    return jsonObjects;
  } catch (err) {
    throw new Error('Cannot read file!: ' + err.message);
  }
};

const importTableQC = async (jsonData) => {
  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"

  function tachChuoi(chuoi) {
    // Kiểm tra đầu vào
    if (typeof chuoi !== 'string' || chuoi.trim() === '') {
      return {
        TenLop: "",
        HocKi: null,
        NamHoc: null,
        Lop: "",
      };
    }

    // Sử dụng biểu thức chính quy để tách chuỗi
    const regex = /^(.*?)(?:\s*\((.*?)\))?-(\d+)-(\d+)\s*\((.*?)\)$/; // Tách các phần
    const match = chuoi.match(regex);

    if (!match) {
      // Trường hợp không khớp với định dạng
      const regexFallback = /^(.*?)(?:\s*\((.*?)\))?$/; // Trường hợp không có học kỳ và năm
      const fallbackMatch = chuoi.match(regexFallback);
      if (fallbackMatch) {
        const tenHP = fallbackMatch[1].trim(); // Tên học phần
        const Lop = fallbackMatch[2] ? fallbackMatch[2].trim() : ""; // Lớp
        return {
          TenLop: tenHP,
          HocKi: null, // Thay đổi giá trị mặc định
          NamHoc: null, // Thay đổi giá trị mặc định
          Lop,
        };
      }

      return {
        TenLop: "",
        HocKi: null,
        NamHoc: null,
        Lop: "",
      };
    }

    // Lấy các thông tin từ kết quả match
    const tenHP = match[1].trim(); // Tên học phần
    const HocKi = match[3] ? match[3].trim() : null; // Học kỳ
    const namHoc = match[4].trim(); // Năm học kèm lớp
    const NamHoc = "20" + namHoc; // Tạo năm học từ phần thứ ba
    const Lop = match[5] ? match[5].trim() : ""; // Lớp

    return {
      TenLop: tenHP,
      HocKi,
      NamHoc,
      Lop,
    };
  }
  // Tạo câu lệnh INSERT động với các trường đầy đủ
  const queryInsert = `
    INSERT INTO ${tableName} (
      Khoa,
      Dot,
      KiHoc,
      NamHoc,
      GiaoVien, 
      GiaoVienGiangDay, 
      MoiGiang, 
      SoTinChi, 
      MaHocPhan, 
      LopHocPhan,
      TenLop, 
      LL, 
      SoTietCTDT, 
      HeSoT7CN, 
      SoSinhVien, 
      HeSoLopDong, 
      QuyChuan, 
      GhiChu
    ) VALUES (?, ?, ?, ?, ?, NULL, FALSE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const insertPromises = jsonData.map(item => {
    return new Promise((resolve, reject) => {
      // Sử dụng hàm tachChuoi để tách các thông tin từ chuỗi
      const { TenLop, HocKi, NamHoc, Lop } = tachChuoi(item['LopHocPhan']);

      const values = [
        item['Khoa'],                                // Khoa
        item['Dot'],                                 // Đợt
        item['Ki'],                                 // Đợt
        item['Nam'],                                 // Đợt
        item['GiaoVien'],                            // Tên Giảng viên
        item['SoTinChi'],                            // Số tín chỉ
        item['MaHocPhan'],                           // Mã học phần
        TenLop,                                         // Lớp học phần (được tách từ chuỗi)
        Lop,
        item['LL'],                                  // LL (Số tiết theo lịch)
        item['SoTietCTDT'],                          // Số tiết theo CTĐT
        item['HeSoT7CN'],                            // Hệ số T7/CN
        item['SoSinhVien'],                           // Số sinh viên
        item['HeSoLopDong'],                         // Hệ số lớp đông
        item['QuyChuan'],                            // Quy chuẩn
        item['GhiChu']                               // Ghi chú
      ];

      connection.query(queryInsert, values, (err, results) => {
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

    // Chạy câu lệnh UPDATE sau khi INSERT thành công
    const queryUpdate = `
      UPDATE ${tableName}
      SET MaHocPhan = CONCAT(Khoa, id);
    `;

    await new Promise((resolve, reject) => {
      connection.query(queryUpdate, (err, results) => {
        if (err) {
          console.error('Error while updating:', err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    results = true;
  } catch (error) {
    console.error('Error:', error);
  }

  return results;
};

// Hàm nhập dữ liệu vào bảng quychuan
const importTableTam = async (jsonData) => {
  const tableName = process.env.DB_TABLE_TAM; // Giả sử biến này có giá trị là "quychuan"

  // Tạo câu lệnh INSERT động
  const query = `
    INSERT INTO ${tableName} (
      Khoa,
      Dot,
      Ki,
      Nam,
      GiaoVien, 
      SoTinChi, 
      LopHocPhan, 
      LL, 
      SoTietCTDT, 
      HeSoT7CN, 
      SoSinhVien, 
      HeSoLopDong, 
      QuyChuan, 
      GhiChu
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const insertPromises = jsonData.map(item => {
    return new Promise((resolve, reject) => {
      const values = [
        item['Khoa'],                               // Khoa
        item['Dot'],                                // Đợt
        item['Ki'],                                // Đợt
        item['Nam'],                                // Đợt
        item['Giáo Viên'],                          // Tên Giảng viên
        item['Số TC'],                               // Số tín chỉ
        item['Lớp học phần'],                        // Lớp học phần                     
        item['Số tiết lên lớp giờ HC'],          // LL (cần xác định từ dữ liệu nếu cần)
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
  const columnIdUser = 'id_User'; // ID Giảng viên
  const columnMaHocPhanGiangDay = 'MaHocPhan'; // Mã học phần
  const columnMaLopGiangDay = 'MaLop'; // Mã lớp
  const columnIdGVM = 'Id_Gvm'; // ID giảng viên mời
  const columnGiaoVien = 'GiaoVien'; // Tên Giảng viên
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

        // Nếu không tìm thấy Giảng viên
        if (results.length === 0) {
          resolve(null); // Không tìm thấy, trả về null
        } else {
          resolve(results[0].id_User); // Lấy id_User của Giảng viên
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
          id_User,                               // ID Giảng viên
          index,                                   // Mã học phần
          index,                                     // mã lớp
          index,                                   // id gvm
          item['Giáo Viên'],                    // Tên Giảng viên
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

const checkExistKhoa = async (req, res) => {
  const { khoa } = req.body; // Lấy giá trị Khoa từ yêu cầu client
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường

  // Câu truy vấn kiểm tra sự tồn tại của giá trị Khoa trong bảng
  const queryCheck = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE Khoa = ?) AS exist;`;

  // Sử dụng Promise để kiểm tra sự tồn tại
  return new Promise((resolve, reject) => {
    connection.query(queryCheck, [khoa], (err, results) => {
      if (err) {
        console.error('Lỗi khi kiểm tra Khoa:', err);
        return reject(res.status(500).json({ error: 'Lỗi kiểm tra cơ sở dữ liệu' }));
      }

      // Kết quả trả về từ cơ sở dữ liệu
      const exist = results[0].exist === 1; // True nếu tồn tại, False nếu không tồn tại

      if (exist) {
        return resolve(res.status(200).json({ message: 'Khoa đã tồn tại trong cơ sở dữ liệu', exists: true }));
      } else {
        return resolve(res.status(200).json({ message: 'Khoa không tồn tại trong cơ sở dữ liệu', exists: false }));
      }
    });
  });
};

// Hàm xóa row theo trường 'Khoa'
const deleteRowByKhoa = (req, res) => {
  const { khoa } = req.body;  // Nhận giá trị từ client thông qua body
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường
  if (!khoa) {
    return res.status(400).json({ message: 'Missing required field: Khoa' });
  }

  // Query SQL để xóa row
  const sql = `DELETE FROM ${tableName} WHERE Khoa = ?`;

  connection.query(sql, [khoa], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error executing query', error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'No row found with the given Khoa' });
    }

    return res.status(200).json({ message: 'Row deleted successfully' });
  });
};

module.exports = { handleUploadAndRender, importJSONToDB, importTableQC, importTableTam, checkExistKhoa, deleteRowByKhoa };
