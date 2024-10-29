const express = require("express");
const ExcelJS = require("exceljs");
const router = express.Router();
const createConnection = require("../config/databaseAsync");
const createPoolConnection = require("../config/databasePool");

exports.exportPhuLucGiangVienMoi = async (req, res) => {
  let connection;
  try {
    connection = await createPoolConnection(); // Kết nối đến database

    // Truy vấn dữ liệu từ database
    const [data] = await connection.execute(`
            SELECT 
                gd.GiangVien, gd.Lop, hd.SoTiet, gd.TenHocPhan, gd.HocKy,
                hd.HocVi, hd.ChucVu, hd.HSL,
                 hd.NgayBatDau, hd.NgayKetThuc
            FROM giangday gd
            JOIN hopdonggvmoi hd ON gd.GiangVien = hd.HoTen
            ORDER BY gd.GiangVien, gd.Lop, gd.TenHocPhan
        `);

    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook();

    // Nhóm dữ liệu theo giảng viên
    const groupedData = data.reduce((acc, cur) => {
      (acc[cur.GiangVien] = acc[cur.GiangVien] || []).push(cur);
      return acc;
    }, {});

    // Tạo một sheet cho mỗi giảng viên
    for (const [giangVien, giangVienData] of Object.entries(groupedData)) {
      const worksheet = workbook.addWorksheet(giangVien);

      // Thêm tiêu đề cố định
      const titleRow1 = worksheet.addRow(["Học Viện Kỹ thuật Mật Mã"]);
      titleRow1.font = { bold: true, size: 20 };
      titleRow1.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
      worksheet.mergeCells("A1:L1"); // Giả sử bạn có 12 cột (A đến L)

      // Tiêu đề phụ
      const titleRow2 = worksheet.addRow(["Phụ lục"]);
      titleRow2.font = { bold: true, size: 14 };
      titleRow2.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
      worksheet.mergeCells("A2:L2");

      // Hợp đồng số
      const titleRow3 = worksheet.addRow([
        "Hợp đồng số:    /HĐ-ĐT ngày   tháng   năm",
      ]);
      titleRow3.font = { bold: true, size: 14 };
      titleRow3.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
      worksheet.mergeCells("A3:L3");

      // Biên bản nghiệm thu
      const titleRow4 = worksheet.addRow([
        "Kèm theo biên bản nghiệm thu và thanh lý Hợp đồng số:     /HĐ-ĐT ngày  tháng  năm ",
      ]);
      titleRow4.font = { bold: true, size: 14 };
      titleRow4.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
      worksheet.mergeCells("A4:L4");

      // Định nghĩa tiêu đề cột
      const header = [
        "Họ Tên",
        "Chức Vụ",
        "Học Vị",
        "Lớp",
        "Số Tiết",
        "Tên Học Phần",
        "Học Kỳ",
        "Ngày Bắt Đầu",
        "Ngày Kết Thúc",
        "Hệ Số Lương",
        "Mức thanh toán",
        "Số Tiền",
        "Trừ Thuế",
        "Thực Nhận",
      ];

      // Thêm tiêu đề cột
      const headerRow = worksheet.addRow(header);
      headerRow.font = { bold: true }; // Đặt tiêu đề cột đậm
      headerRow.eachCell((cell) => {
        cell.fill = {
          // Tô màu nền cho hàng tiêu đề
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF00" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
        cell.alignment = { horizontal: "center" }; // Căn giữa
      });

      // Biến để theo dõi vị trí hàng hiện tại
      let currentRowIndex = 5; // Bắt đầu từ hàng thứ 5 (sau tiêu đề cố định và tiêu đề cột)
      let totalSoTiet = 0; // Tổng Số Tiết
      let totalSoTien = 0; // Tổng Số Tiền
      let totalTruThue = 0; // Tổng Trừ Thuế
      let totalThucNhan = 0; // Tổng Thực Nhận

      giangVienData.forEach((item, index) => {
        const mucThanhToan = 100000; // Giá trị cố định cho cột "Mức Thanh Toán"
        const soTien = item.SoTiet * mucThanhToan; // Tính Số Tiền
        const truThue = soTien * 0.1; // Trừ Thuế 10%
        const thucNhan = soTien - truThue; // Thực Nhận

        // Thêm hàng mới với dữ liệu cho tất cả các cột
        const row = worksheet.addRow([
          item.GiangVien, // Họ Tên
          item.ChucVu, // Chức Vụ
          item.HocVi, // Học Vị
          item.Lop, // Lớp
          item.SoTiet, // Số Tiết
          item.TenHocPhan, // Tên Học Phần
          item.HocKy, // Học Kỳ
          new Date(item.NgayBatDau).toLocaleDateString(), // Ngày Bắt Đầu
          new Date(item.NgayKetThuc).toLocaleDateString(), // Ngày Kết Thúc
          item.HSL, // Hệ Số Lương
          mucThanhToan,
          soTien, // Số Tiền
          truThue, // Trừ Thuế
          thucNhan, // Thực Nhận
        ]);

        // Cộng dồn tổng
        totalSoTiet += item.SoTiet;
        totalSoTien += item.SoTien;
        totalTruThue += item.TruThue;
        totalThucNhan += item.ThucNhan;

        currentRowIndex++;
      });

      // Thêm hàng Tổng cộng với định dạng đẹp
      const totalRow = worksheet.addRow([
        "Tổng cộng",
        "",
        "",
        "",
        totalSoTiet,
        "",
        "",
        "",
        "",
        "",
        "",
        totalSoTien,
        totalTruThue,
        totalThucNhan,
      ]);
      totalRow.font = { bold: true, color: { argb: "FF0000FF" } }; // Màu chữ cho tổng cộng
      totalRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center" }; // Căn giữa
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      // Định dạng worksheet và thêm viền từ dòng 5 trở đi
      worksheet.columns.forEach((column) => {
        column.width = 15; // Cài đặt chiều rộng cột
        column.style = {}; // Đảm bảo không có màu sắc
      });

      // Thêm viền cho tất cả các ô từ dòng thứ 5 trở đi
      const rowCount = worksheet.lastRow.number; // Tổng số hàng đã thêm
      for (let i = 5; i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };
        });
      }
    }

    // Thiết lập tên tệp và gửi tệp cho người dùng
    const fileName = `PhuLucGiangVienMoi_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Lỗi xuất file:", error);
    res.status(500).send("Đã xảy ra lỗi khi xuất file.");
  } finally {
    if (connection) {
      if (connection) connection.release(); // Giải phóng kết nối
    }
  }
};
