// controllers/fileAndRenderController.js

const XLSX = require('xlsx');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const connection = require('../controllers/connectDB');


// Hàm chuyển đổi tệp Excel sang JSON
const convertExcelToJSON = (filePath) => {
  try {
    console.log('test3')

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
    console.log('test3')
    return jsonObjects;
  } catch (err) {
    throw new Error('Cannot read file!: ' + err.message);
  }
};

// Hàm nhập dữ liệu JSON vào cơ sở dữ liệu
const importJSONToDB = async (jsonData) => {
  const tableName = process.env.DB_TABLE_NAME;

  const columnTT = 'TT';
  const columnSoTinChi = 'SoTinChi';
  const columnLopHocPhan = 'LopHocPhan';
  const columnGiaoVien = 'GiaoVien';
  const columnLL = 'LL';
  const columnSoTietCTDT = 'SoTietCTDT';
  const columnHeSoT7CN = 'HeSoT7CN';
  const columnSoSinhVien = 'SoSinhVien';
  const columnHeSoLopDong = 'HeSoLopDong';
  const columnQuyChuan = 'QuyChuan';
  const columnGhiChu = 'GhiChu';

  const insertPromises = jsonData.map(item => {
    const query = `INSERT INTO ${tableName} 
      (${columnTT}, ${columnSoTinChi}, ${columnLopHocPhan}, ${columnGiaoVien}, ${columnLL}, 
       ${columnSoTietCTDT}, ${columnHeSoT7CN}, ${columnSoSinhVien}, ${columnHeSoLopDong}, ${columnQuyChuan}, ${columnGhiChu}) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    return new Promise((resolve, reject) => {
      const keys = Object.keys(item);
      connection.query(query, [
        item[keys[0]],
        item[keys[1]],
        item[keys[2]],
        item[keys[3]],
        item[keys[4]],
        item[keys[5]],
        item[keys[6]],
        item[keys[7]],
        item[keys[8]],
        item[keys[9]],
        item[keys[10]]
      ], (err, results) => {
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



const handleUploadAndRender = async (req, res) => {

  console.log('test2')

  const filePath = path.join(__dirname, '../../uploads', req.file.filename);

  // Chuyển đổi file Excel sang JSON
  const jsonResult = convertExcelToJSON(filePath);


  res.send(jsonResult);

};

module.exports = { handleUploadAndRender, importJSONToDB };