const express = require("express");
const ExcelJS = require("exceljs");
const router = express.Router();
const createConnection = require("../config/databaseAsync");

exports.exportPhuLucGiangVienMoi = async (req, res) => {
  let connection;
  try {
    connection = await createConnection(); // Kết nối đến database

    // Truy vấn dữ liệu từ database
    const [data] = await connection.execute(`
            SELECT 
                gd.GiangVien, gd.Lop, hd.SoTiet, gd.TenHocPhan, gd.HocKy,
                hd.HocVi, hd.HSL,
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
        
        // Thêm tiêu đề "Ban Cơ yếu Chính phủ" phía trên
        const titleRow0 = worksheet.addRow(['Ban Cơ yếu Chính phủ']);
        titleRow0.font = { name: 'Times New Roman', size: 15 };
        titleRow0.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A1:C1'); // Giả sử bạn có 12 cột (A đến L)

        // Cập nhật vị trí tiêu đề "Học Viện Kỹ thuật Mật Mã" và các dòng tiêu đề khác
        const titleRow1 = worksheet.addRow(['Học Viện Kỹ thuật Mật Mã']);
        titleRow1.font = { name: 'Times New Roman', bold: true, size: 20 };
        titleRow1.alignment = { vertical: 'middle' };
        worksheet.mergeCells('A2:F2');

        const titleRow2 = worksheet.addRow(['Phụ lục']);
        titleRow2.font = { name: 'Times New Roman', bold: true, size: 14 };
        titleRow2.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A3:L3');

        const titleRow3 = worksheet.addRow(['Hợp đồng số:    /HĐ-ĐT ngày   tháng   năm']);
        titleRow3.font = { name: 'Times New Roman', bold: true, size: 14 };
        titleRow3.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A4:L4');

        const titleRow4 = worksheet.addRow(['Kèm theo biên bản nghiệm thu và thanh lý Hợp đồng số:     /HĐ-ĐT ngày  tháng  năm ']);
        titleRow4.font = { name: 'Times New Roman', bold: true, size: 14 };
        titleRow4.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells('A5:L5');

        // Định nghĩa tiêu đề cột
        const header = [
            'Họ Tên', 'Học Vị', 'Lớp', 'Số Tiết', 'Tên Học Phần',
            'HK', 'Thời Gian Thực Hiện', 'Hệ Số Lương', 'Mức thanh toán',
            'Số Tiền', 'Trừ Thuế', 'Thực Nhận'
        ];

        // Thêm tiêu đề cột
        const headerRow = worksheet.addRow(header);
        headerRow.font = { name: 'Times New Roman', bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFF00' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { horizontal: 'center' };
        });

        let totalSoTiet = 0;
        let totalSoTien = 0;
        let totalTruThue = 0;
        let totalThucNhan = 0;

        giangVienData.forEach((item) => {
            const mucThanhToan = 100000;
            const soTien = item.SoTiet * mucThanhToan;
            const truThue = soTien * 0.1;
            const thucNhan = soTien - truThue;

            const thoiGianThucHien = `${new Date(item.NgayBatDau).toLocaleDateString()} - ${new Date(item.NgayKetThuc).toLocaleDateString()}`;

            const row = worksheet.addRow([
                item.GiangVien, item.HocVi, item.Lop, item.SoTiet,
                item.TenHocPhan, item.HocKy, thoiGianThucHien, item.HSL,
                mucThanhToan, soTien, truThue, thucNhan
            ]);
            row.font = { name: 'Times New Roman' };

            totalSoTiet += item.SoTiet;
            totalSoTien += soTien;
            totalTruThue += truThue;
            totalThucNhan += thucNhan;
        });

        const totalRow = worksheet.addRow(['Tổng cộng', '', '', totalSoTiet, '', '', '', '', '', totalSoTien, totalTruThue, totalThucNhan]);
        totalRow.font = { name: 'Times New Roman', bold: true };

        totalRow.eachCell((cell) => {
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Định dạng chiều rộng cột
        worksheet.getColumn('D').width = 10; // Chiều rộng cột "Số Tiết"
        worksheet.getColumn('F').width = 10; // Chiều rộng cột "Học Kỳ"
        worksheet.getColumn('I').width = 10; // Chiều rộng cột "Hệ Số Lương"
        worksheet.getColumn('J').width = 15; // Chiều rộng cột "Mức thanh toán"
        worksheet.getColumn('K').width = 15; // Chiều rộng cột "Số Tiền"
        worksheet.getColumn('L').width = 15; // Chiều rộng cột "Trừ Thuế"
        worksheet.getColumn('M').width = 15; // Chiều rộng cột "Thực Nhận"

        // Định dạng viền cho các hàng từ dòng thứ 6 trở đi
        const rowCount = worksheet.lastRow.number;
        for (let i = 6; i <= rowCount; i++) {
            const row = worksheet.getRow(i);
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
        }
    }

    const fileName = `PhuLucGiangVienMoi_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
      console.error("Lỗi xuất file:", error);
      res.status(500).send("Đã xảy ra lỗi khi xuất file.");
  } finally {
      if (connection) {
          await connection.end();
      }
  }
};
