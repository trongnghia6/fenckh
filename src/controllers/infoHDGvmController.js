const express = require("express");
const createConnection = require("../config/databaseAsync");
const createPoolConnection = require("../config/databasePool");
const ExcelJS = require("exceljs");
const router = express.Router();
const mysql = require("mysql2/promise");
const xlsx = require("xlsx");
const path = require("path"); // Thêm dòng này

const getGvm = async (req, res) => {
  try {
    const gvmLists = await fetchHDGvmData();
    res.json(gvmLists); // Trả về danh sách giảng viên mời
  } catch (error) {
    console.error("Error fetching HD Gvm:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Xử lý lỗi
  }
};

// async function fetchHDGvmData() {
//   connection = await createConnection();

//   const [rows] = await connection.execute("SELECT * FROM hopdonggvmoi"); // Thay đổi theo bảng giảng viên mời
//   return rows;
// }
async function fetchHDGvmData() {
  const connection = await pool.getConnection(); // Lấy một connection từ pool

  try {
    const [rows] = await connection.execute("SELECT * FROM hopdonggvmoi");
    return rows;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Xử lý lỗi tùy ý
  } finally {
    connection.release(); // Trả lại connection về pool
  }
}

// Hàm xuất dữ liệu ra Excel

// Hàm xuất dữ liệu ra Excel với định dạng đẹp hơn
const exportHDGvmToExcel = async (req, res) => {
  let connection;
  try {
    connection = await createPoolConnection();
    console.log("Kết nối database thành công");

    const namHoc = req.query.namHoc;
    const dot = req.query.dot;
    const ki = req.query.ki;

    // Truy vấn dữ liệu mà không lấy các cột không cần thiết
    const [rows] = await connection.execute(
      // `SELECT NgayBatDau, NgayKetThuc, KiHoc, DanhXung, HoTen, NgaySinh, CCCD, NoiCapCCCD, DiaChi, Email,
      //     MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, SUM(SoTiet) AS SoTiet
      //  FROM hopdonggvmoi
      //  WHERE NamHoc = ? AND Dot = ? AND KiHoc = ?
      //  GROUP BY HoTen;`,
      `SELECT
          MIN(NgayBatDau) AS NgayBatDau,
          MAX(NgayKetThuc) AS NgayKetThuc,
          KiHoc,
          DanhXung,
          HoTen,
          NgaySinh,
          CCCD,
          NoiCapCCCD,
          DiaChi,
          Email,
          MaSoThue,
          HocVi,
          ChucVu,
          HSL,
          DienThoai,
          STK,
          NganHang,
          SUM(SoTiet) AS SoTiet
      FROM
          hopdonggvmoi
      WHERE
          NamHoc = ? AND Dot = ? AND KiHoc = ?
      GROUP BY
          HoTen, KiHoc, DanhXung, NgaySinh, CCCD, NoiCapCCCD, Email,
          MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang;`,

      [namHoc, dot, ki]
    );

    console.log("Lấy dữ liệu từ bảng hopdonggvmoi thành công");

    if (rows.length === 0) {
      console.log("Không có dữ liệu để xuất ");
      res.send(
        "<script>alert('Không có dữ liệu để xuất '); window.location.href='/infoHDGvm';</script>"
      );
      return;
    }

    // Tạo workbook và worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("GiangVienMoi");

    // Định nghĩa các cột và tiêu đề
    worksheet.columns = [
      { header: "Ngày Bắt Đầu", key: "NgayBatDau", width: 15 },
      { header: "Ngày Kết Thúc", key: "NgayKetThuc", width: 15 },
      { header: "Kì Học", key: "KiHoc", width: 10 },
      { header: "Danh Xưng", key: "DanhXung", width: 12 },
      { header: "Họ Tên", key: "HoTen", width: 20 },
      { header: "Ngày Sinh", key: "NgaySinh", width: 15 },
      { header: "CCCD", key: "CCCD", width: 15 },
      { header: "Nơi Cấp CCCD", key: "NoiCapCCCD", width: 15 },
      { header: "Địa Chỉ Theo CCCD", key: "DiaChi", width: 20 },
      { header: "Email", key: "Email", width: 25 },
      { header: "Mã Số Thuế", key: "MaSoThue", width: 15 },
      { header: "Học Vị", key: "HocVi", width: 10 },
      { header: "Chức Vụ", key: "ChucVu", width: 12 },
      { header: "HSL", key: "HSL", width: 10 },
      { header: "Điện Thoại", key: "DienThoai", width: 15 },
      { header: "Số Tài Khoản", key: "STK", width: 15 },
      { header: "Ngân Hàng", key: "NganHang", width: 20 },
      { header: "Số Tiết", key: "SoTiet", width: 10 },
      { header: "Số Tiền", key: "SoTien", width: 15 },
      { header: "Số Tiền Bằng Chữ", key: "BangChuSoTien", width: 30 },
      { header: "Trừ Thuế", key: "TruThue", width: 15 },
      { header: "Trừ Thuế Bằng Chữ", key: "BangChuTruThue", width: 30 },
      { header: "Thực Nhận", key: "ThucNhan", width: 15 },
      { header: "Thực Nhận Bằng Chữ", key: "BangChuThucNhan", width: 30 },
      { header: "Ngày Nghiệm Thu", key: "NgayNghiemThu", width: 15 }, // Thêm cột Ngày Nghiệm Thu
    ];

    // Thêm dữ liệu vào bảng và tính toán các cột mới
    rows.forEach((row) => {
      const soTien = row.SoTiet * 100000; // Số Tiền = Số Tiết * 100000
      const truThue = soTien * 0.1; // Trừ Thuế = 10% của Số Tiền
      const thucNhan = soTien - truThue; // Thực Nhận = Số Tiền - Trừ Thuế
      // Sửa lại ngày
      // Sửa lại ngày bắt đầu
      const utcBatDau = new Date(row.NgayBatDau);
      row.NgayBatDau = utcBatDau.toLocaleDateString("vi-VN"); // Chỉ lấy phần ngày

      // Sửa lại ngày kết thúc
      const utcKetThuc = new Date(row.NgayKetThuc);
      row.NgayKetThuc = utcKetThuc.toLocaleDateString("vi-VN"); // Chỉ lấy phần ngày

      // Sửa lại ngày sinh
      const utcSinh = new Date(row.NgaySinh);
      row.NgaySinh = utcSinh.toLocaleDateString("vi-VN"); // Chỉ lấy phần ngày

      // het
      worksheet.addRow({
        ...row,
        SoTien: soTien,
        BangChuSoTien: numberToWords(soTien), // Sử dụng hàm mới
        TruThue: truThue,
        BangChuTruThue: numberToWords(truThue), // Sử dụng hàm mới
        ThucNhan: thucNhan,
        BangChuThucNhan: numberToWords(thucNhan), // Sử dụng hàm mới
        NgayNghiemThu: row.NgayKetThuc,
      });
    });

    // Định dạng tiêu đề (in đậm và căn giữa)
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Thêm border cho các ô trong bảng
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Ghi file Excel
    const filePath = path.join(
      __dirname,
      "../public/exports/hopdonggvmList.xlsx"
    );
    await workbook.xlsx.writeFile(filePath);
    console.log("Ghi file Excel thành công");

    // Tải file về cho client
    res.download(filePath, "hopdonggvmList.xlsx", (err) => {
      if (err) {
        console.log("Lỗi khi tải file:", err);
      } else {
        console.log("File đã được tải thành công!");
      }
    });
  } catch (error) {
    console.error("Lỗi khi xuất dữ liệu:", error);
    res.status(500).send("Có lỗi xảy ra khi xuất dữ liệu");
  } finally {
    if (connection) connection.release(); // Trả lại connection cho pool
  }
};

// hàm chuyển tiền sang chữ số
// Hàm chuyển đổi số thành chữ
const numberToWords = (num) => {
  if (num === 0) return "không đồng";

  const ones = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
  ];
  const teens = [
    "mười",
    "mười một",
    "mười hai",
    "mười ba",
    "mười bốn",
    "mười lăm",
    "mười sáu",
    "mười bảy",
    "mười tám",
    "mười chín",
  ];
  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];
  const thousands = ["", "nghìn", "triệu", "tỷ"];

  let words = "";
  let unitIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk) {
      let chunkWords = [];
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;

      if (hundreds) {
        chunkWords.push(ones[hundreds]);
        chunkWords.push("trăm");
      }

      if (remainder < 10) {
        if (remainder > 0) {
          if (hundreds) chunkWords.push("lẻ");
          chunkWords.push(ones[remainder]);
        }
      } else if (remainder < 20) {
        chunkWords.push(teens[remainder - 10]);
      } else {
        const tenPlace = Math.floor(remainder / 10);
        const onePlace = remainder % 10;

        chunkWords.push(tens[tenPlace]);
        if (onePlace === 1 && tenPlace > 1) {
          chunkWords.push("mốt");
        } else if (onePlace === 5 && tenPlace > 0) {
          chunkWords.push("lăm");
        } else if (onePlace) {
          chunkWords.push(ones[onePlace]);
        }
      }

      if (unitIndex > 0) {
        chunkWords.push(thousands[unitIndex]);
      }
      
      words = chunkWords.join(" ") + " " + words;
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }

  return words.trim() + " đồng";
};

const getHDGvmData = async (req, res) => {
  let connection;
  try {
    connection = await createPoolConnection();
    const namHoc = req.query.namHoc;
    const dot = req.query.dot;
    const ki = req.query.ki;

    const [rows] = await connection.execute(
      // `SELECT NgayBatDau, NgayKetThuc, KiHoc, DanhXung, HoTen, SUM(SoTiet) AS SoTiet, NgaySinh, CCCD, NoiCapCCCD, Email,
      //     MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, NgayNghiemThu
      //  FROM hopdonggvmoi
      //  WHERE NamHoc = ? AND Dot = ? AND KiHoc = ?
      //  GROUP BY HoTen;`,
      `SELECT
          MIN(NgayBatDau) AS NgayBatDau,
          MAX(NgayKetThuc) AS NgayKetThuc,
          KiHoc,
          DanhXung,
          HoTen,
          NgaySinh,
          CCCD,
          NoiCapCCCD,
          Email,
          MaSoThue,
          HocVi,
          ChucVu,
          HSL,
          DienThoai,
          STK,
          NganHang,
          SUM(SoTiet) AS SoTiet
      FROM
          hopdonggvmoi
      WHERE
          NamHoc = ? AND Dot = ? AND KiHoc = ?
      GROUP BY
          HoTen, KiHoc, DanhXung, NgaySinh, CCCD, NoiCapCCCD, Email,
          MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang;`,
      [namHoc, dot, ki]
    );

    console.log("xem ", rows);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching HD Gvm data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release(); // Trả lại connection cho pool
  }
};

module.exports = {
  exportHDGvmToExcel,
  getHDGvmData,
};
