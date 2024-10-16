const express = require("express");
const createConnection = require("../config/databaseAsync");
const ExcelJS = require("exceljs");
const router = express.Router();
const mysql = require("mysql2/promise");
const xlsx = require("xlsx");

const getGvm = async (req, res) => {
  try {
    const gvmLists = await fetchHDGvmData();
    res.json(gvmLists); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching HD Gvm:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

async function fetchHDGvmData() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "ttcs2",
  });

  const [rows] = await connection.execute("SELECT * FROM hopdonggvmoi"); // Thay đổi theo bảng giảng viên mời
  return rows;
}

// Hàm xuất dữ liệu ra Excel
const exportHDGvmToExcel = async (req, res) => {
    console.log('Hàm exportHDGvmToExcel được gọi');
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'ttcs2'
      });
      console.log('Kết nối database thành công');
      const namHoc = req.query.namHoc;
      const dot = req.query.dot;
      const ki = req.query.ki;
      const [rows] = await connection.execute('SELECT NgayBatDau, NgayKetThuc, KiHoc, DanhXung, HoTen, NgaySinh, CCCD, NoiCapCCCD, Email, MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang,SoTiet, SoTien, TruThue, ThucNhan, NgayNghiemThu FROM hopdonggvmoi WHERE NamHoc = ? AND Dot = ? AND KiHoc = ?', [namHoc, dot, ki]);      rows.forEach((row) => {
        row.BangChuSoTien = soTienBangChu(row.SoTien);
        row.BangChuTruThue = soTienBangChu(row.TruThue);
        row.BangChuThucNhan = soTienBangChu(row.ThucNhan);
      });
      console.log('Lấy dữ liệu từ bảng hopdonggvmoi thành công');
      if (rows.length === 0) {
        console.log('Không có dữ liệu để xuất khẩu');
        res.status(404).send('Không có dữ liệu để xuất khẩu');
        return;
      }
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'GiangVienMoi');
      console.log('Tạo file Excel thành công');
      const filePath = './hopdonggvmList.xlsx';
      xlsx.writeFile(wb, filePath);
      console.log('Ghi file Excel thành công');
      res.download(filePath, 'hopdonggvmList.xlsx', (err) => {
        if (err) {
          console.log('Lỗi khi tải file:', err);
        } else {
          console.log('File đã được tải thành công!');
        }
      });
    } catch (error) {
      console.error('Lỗi khi xuất dữ liệu:', error);
      res.status(500).send('Có lỗi xảy ra khi xuất dữ liệu');
    }
};
// hàm chuyển tiền sang chữ số
function soTienBangChu(soTien) {
  const soTienBangChu = {
    0: 'Không',
    1: 'Một',
    2: 'Hai',
    3: 'Ba',
    4: 'Bốn',
    5: 'Năm',
    6: 'Sáu',
    7: 'Bảy',
    8: 'Tám',
    9: 'Chín',
  };

  const donVi = ['', 'Mươi', 'Trăm', 'Nghìn', 'Triệu', 'Tỷ'];
  
  // Xử lý số tiền thành nguyên và phần thập phân
  const soTienString = soTien.toString().split('.');
  const soTienNguyen = soTienString[0];
  const soTienThapPhan = soTienString[1];

  let bangChuNguyen = '';
  let bangChuThapPhan = '';

  // Xử lý phần nguyên của số tiền
  for (let i = 0; i < soTienNguyen.length; i++) {
    const soTienDigit = parseInt(soTienNguyen[i]);
    const donViDigit = (soTienNguyen.length - i - 1) % 3;  // tính vị trí theo nhóm hàng trăm
    const hangNhom = Math.floor((soTienNguyen.length - i - 1) / 3); // nhóm nghìn, triệu, tỷ

    if (soTienDigit !== 0 || donViDigit === 2 || (donViDigit === 1 && soTienNguyen[i - 1] != 0)) {
      // Xử lý các trường hợp đặc biệt với chữ "mốt", "lăm"
      if (donViDigit === 1 && soTienDigit === 1) {
        bangChuNguyen += "Mười ";
      } else if (donViDigit === 1 && soTienDigit === 5 && soTienNguyen[i - 1] != 0) {
        bangChuNguyen += "Lăm ";
      } else {
        bangChuNguyen += soTienBangChu[soTienDigit] + ' ' + donVi[donViDigit] + ' ';
      }
    }
    
    // Thêm đơn vị nghìn, triệu, tỷ nếu đúng vị trí
    if (donViDigit === 0 && hangNhom > 0 && (soTienNguyen.length - i - 1 > 0 || soTienDigit !== 0)) {
      bangChuNguyen += donVi[hangNhom + 2] + ' ';
    }
  }

  // Xử lý phần thập phân (nếu có)
  if (soTienThapPhan) {
    bangChuThapPhan = 'phẩy ';
    for (let i = 0; i < soTienThapPhan.length; i++) {
      const soTienDigit = parseInt(soTienThapPhan[i]);
      bangChuThapPhan += soTienBangChu[soTienDigit] + ' ';
    }
  }

  // Kết hợp phần nguyên và phần thập phân với đơn vị "Đồng"
  return bangChuNguyen.trim() + ' Đồng' + (bangChuThapPhan.trim() ? ' ' + bangChuThapPhan.trim() : '');
}


module.exports = {
  exportHDGvmToExcel,
};
