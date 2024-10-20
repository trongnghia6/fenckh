const express = require("express");
const createConnection = require("../config/databaseAsync");
const ExcelJS = require("exceljs");
const router = express.Router();
const mysql = require("mysql2/promise");
const xlsx = require("xlsx");
const path = require('path'); // Thêm dòng này





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
  connection = await createConnection();

  const [rows] = await connection.execute("SELECT * FROM hopdonggvmoi"); // Thay đổi theo bảng giảng viên mời
  return rows;
}

// Hàm xuất dữ liệu ra Excel

// Hàm xuất dữ liệu ra Excel với định dạng đẹp hơn
const exportHDGvmToExcel = async (req, res) => {
  console.log('Hàm exportHDGvmToExcel được gọi');
  try {
    const connection = await createConnection();
    console.log('Kết nối database thành công');

    const namHoc = req.query.namHoc;
    const dot = req.query.dot;
    const ki = req.query.ki;

    // Truy vấn dữ liệu mà không lấy các cột không cần thiết
    const [rows] = await connection.execute(
      'SELECT NgayBatDau, NgayKetThuc, KiHoc, DanhXung, HoTen, NgaySinh, CCCD, NoiCapCCCD, Email, MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, SoTiet, NgayNghiemThu FROM hopdonggvmoi WHERE NamHoc = ? AND Dot = ? AND KiHoc = ?',
      [namHoc, dot, ki]
    );

    console.log('Lấy dữ liệu từ bảng hopdonggvmoi thành công');

    if (rows.length === 0) {
      console.log('Không có dữ liệu để xuất khẩu');
      res.status(404).send('Không có dữ liệu để xuất khẩu');
      return;
    }

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GiangVienMoi');

    // Định nghĩa các cột và tiêu đề
    worksheet.columns = [
      { header: 'Ngày Bắt Đầu', key: 'NgayBatDau', width: 15 },
      { header: 'Ngày Kết Thúc', key: 'NgayKetThuc', width: 15 },
      { header: 'Kì Học', key: 'KiHoc', width: 10 },
      { header: 'Danh Xưng', key: 'DanhXung', width: 12 },
      { header: 'Họ Tên', key: 'HoTen', width: 20 },
      { header: 'Ngày Sinh', key: 'NgaySinh', width: 15 },
      { header: 'CCCD', key: 'CCCD', width: 15 },
      { header: 'Nơi Cấp CCCD', key: 'NoiCapCCCD', width: 15 },
      { header: 'Email', key: 'Email', width: 25 },
      { header: 'Mã Số Thuế', key: 'MaSoThue', width: 15 },
      { header: 'Học Vị', key: 'HocVi', width: 10 },
      { header: 'Chức Vụ', key: 'ChucVu', width: 12 },
      { header: 'HSL', key: 'HSL', width: 10 },
      { header: 'Điện Thoại', key: 'DienThoai', width: 15 },
      { header: 'Số Tài Khoản', key: 'STK', width: 15 },
      { header: 'Ngân Hàng', key: 'NganHang', width: 20 },
      { header: 'Số Tiết', key: 'SoTiet', width: 10 },
      { header: 'Số Tiền', key: 'SoTien', width: 15 },
      { header: 'Số Tiền Bằng Chữ', key: 'BangChuSoTien', width: 30 },
      { header: 'Trừ Thuế', key: 'TruThue', width: 15 },
      { header: 'Trừ Thuế Bằng Chữ', key: 'BangChuTruThue', width: 30 },
      { header: 'Thực Nhận', key: 'ThucNhan', width: 15 },
      { header: 'Thực Nhận Bằng Chữ', key: 'BangChuThucNhan', width: 30 },
      { header: 'Ngày Nghiệm Thu', key: 'NgayNghiemThu', width: 15 },
    ];

    // Thêm dữ liệu vào bảng và tính toán các cột mới
    rows.forEach((row) => {
      const soTien = row.SoTiet * 100000; // Số Tiền = Số Tiết * 100000
      const truThue = soTien * 0.1; // Trừ Thuế = 10% của Số Tiền
      const thucNhan = soTien - truThue; // Thực Nhận = Số Tiền - Trừ Thuế

      worksheet.addRow({
        ...row,
        SoTien: soTien,
        BangChuSoTien: soTienBangChu(soTien), // Số Tiền Bằng Chữ
        TruThue: truThue,
        BangChuTruThue: soTienBangChu(truThue), // Trừ Thuế Bằng Chữ
        ThucNhan: thucNhan,
        BangChuThucNhan: soTienBangChu(thucNhan) // Thực Nhận Bằng Chữ
      });
    });

    // Định dạng tiêu đề (in đậm và căn giữa)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Thêm border cho các ô trong bảng
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Ghi file Excel
    const filePath = path.join(__dirname, 'hopdonggvmList.xlsx');
    await workbook.xlsx.writeFile(filePath);
    console.log('Ghi file Excel thành công');

    // Tải file về cho client
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
const getHDGvmData = async (req, res) => {
  try {
    const connection = await createConnection();
    const namHoc = req.query.namHoc;
    const dot = req.query.dot;
    const ki = req.query.ki;

    const [rows] = await connection.execute(
      'SELECT NgayBatDau, NgayKetThuc, DanhXung, HoTen, NgaySinh, CCCD, HocVi, ChucVu, DienThoai, Email, STK, NganHang, MaSoThue, SoTiet FROM hopdonggvmoi WHERE NamHoc = ? AND Dot = ? AND KiHoc = ?',
      [namHoc, dot, ki]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching HD Gvm data:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  exportHDGvmToExcel,
  getHDGvmData
};


