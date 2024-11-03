const express = require("express");
const ExcelJS = require("exceljs");
const createConnection = require("../config/databaseAsync");
const fs = require('fs');
const path = require('path');


function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-z0-9]/gi, '_');
}

exports.exportPhuLucGiangVienMoi = async (req, res) => {
    let connection;
    try {
        connection = await createConnection();

        const { dot, ki, namHoc, khoa, teacherName } = req.query;

        if (!dot || !ki || !namHoc) {
            return res.status(400).send('Thiếu thông tin đợt, kỳ hoặc năm học');
        }

        let query = `
        SELECT 
            gd.GiangVien, gd.Lop, hd.SoTiet, gd.TenHocPhan, gd.HocKy,
            hd.HocVi, hd.HSL, hd.DiaChi,
            hd.NgayBatDau, hd.NgayKetThuc
        FROM giangday gd
        JOIN hopdonggvmoi hd ON gd.GiangVien = hd.HoTen
        WHERE hd.Dot = ? AND hd.KiHoc = ? AND hd.NamHoc = ?
    `;
        let params = [dot, ki, namHoc];

        // Nếu khoa không được chỉ định hoặc là 'ALL', không cần thêm điều kiện
        if (khoa && khoa !== 'ALL') {
            query += ' AND hd.MaPhongBan = ?';
            params.push(khoa);
        }

        if (teacherName) {
            query += ' AND gd.GiangVien LIKE ?';
            params.push(`%${teacherName}%`);
        }

        const [data] = await connection.execute(query, params);

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
      const titleRow0 = worksheet.addRow(["Ban Cơ yếu Chính phủ"]);
      titleRow0.font = { name: "Times New Roman", size: 15 };
      titleRow0.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.mergeCells(`A${titleRow0.number}:C${titleRow0.number}`);

      // Cập nhật vị trí tiêu đề "Học Viện Kỹ thuật Mật Mã"
      const titleRow1 = worksheet.addRow(["Học Viện Kỹ thuật Mật Mã"]);
      titleRow1.font = { name: "Times New Roman", bold: true, size: 20 };
      titleRow1.alignment = { vertical: "middle" };
      worksheet.mergeCells(`A${titleRow1.number}:F${titleRow1.number}`);

      const titleRow2 = worksheet.addRow(["Phụ lục"]);
      titleRow2.font = { name: "Times New Roman", bold: true, size: 14 };
      titleRow2.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.mergeCells(`A${titleRow2.number}:K${titleRow2.number}`);

      const titleRow3 = worksheet.addRow([
        "Hợp đồng số:    /HĐ-ĐT ngày   tháng   năm",
      ]);
      titleRow3.font = { name: "Times New Roman", bold: true, size: 14 };
      titleRow3.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.mergeCells(`A${titleRow3.number}:K${titleRow3.number}`);

      const titleRow4 = worksheet.addRow([
        "Kèm theo biên bản nghiệm thu và thanh lý Hợp đồng số:     /HĐ-ĐT ngày  tháng  năm ",
      ]);
      titleRow4.font = { name: "Times New Roman", bold: true, size: 14 };
      titleRow4.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.mergeCells(`A${titleRow4.number}:K${titleRow4.number}`);

            // Đặt vị trí cho tiêu đề "Đơn vị tính: Đồng" vào cột K đến M
            const titleRow5 = worksheet.addRow(['', '', '', '', '', '', '', '', '','', 'Đơn vị tính: Đồng', '', '']);
            titleRow5.font = { name: 'Times New Roman', bold: true, size: 10 };
            titleRow5.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`K${titleRow5.number}:M${titleRow5.number}`);

            // Định nghĩa tiêu đề cột
            const header = [
                'Họ tên giảng viên', 'Tên học phần', 'Tên lớp', 'Số tiết', 'Thời gian thực hiện',
                'Học kỳ', 'Địa Chỉ', 'Học vị', 'Hệ số lương', 'Mức thanh toán',
                'Thành tiền', 'Trừ thuế TNCN 10%', 'Còn lại'
            ];

            // Thêm tiêu đề cột
            const headerRow = worksheet.addRow(header);
            headerRow.font = { name: 'Times New Roman', bold: true };
            worksheet.pageSetup = {
                paperSize: 9, // A4 paper size
                orientation: 'landscape',
                fitToPage: true, // Fit to page
                fitToWidth: 1, // Fit to width
                fitToHeight: 0, // Do not fit to height
                margins: {
                    left: 0.3149,
                    right: 0.3149,
                    top: 0,
                    bottom: 0,
                    header: 0.3149,
                    footer: 0.3149
                }
            };

            // Căn chỉnh độ rộng cột
            worksheet.getColumn(1).width = 15;  // Họ tên giảng viên
            worksheet.getColumn(2).width = 20;  // Tên học phần
            worksheet.getColumn(3).width = 15;  // Tên lớp
            worksheet.getColumn(4).width = 10;  // Số tiết
            worksheet.getColumn(5).width = 20;  // Thời gian thực hiện
            worksheet.getColumn(6).width = 10;  // Học kỳ
            worksheet.getColumn(7).width = 20;  // Địa Chỉ
            worksheet.getColumn(8).width = 15;  // Học vị
            worksheet.getColumn(9).width = 10;  // Hệ số lương
            worksheet.getColumn(10).width = 15; // Mức thanh toán
            worksheet.getColumn(11).width = 15; // Thành tiền
            worksheet.getColumn(12).width = 15; // Trừ thuế TNCN 10%
            worksheet.getColumn(13).width = 15; // Còn lại
            // Bật wrapText cho tiêu đề
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
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
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
                    item.GiangVien, item.TenHocPhan, item.Lop, item.SoTiet, thoiGianThucHien,
                    item.HocKy, item.DiaChi, item.HocVi, item.HSL, mucThanhToan,
                    soTien, truThue, thucNhan
                ]);
                row.font = { name: 'Times New Roman', size: 12 };

                // Bật wrapText cho các ô dữ liệu và căn giữa
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

                    // Chỉnh cỡ chữ cho từng cột
                    switch (colNumber) {
                        case 1: // Họ tên giảng viên
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 2: // Tên học phần
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 3: // Tên lớp
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 4: // Số tiết
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 5: // Thời gian thực hiện
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 6: // Học kỳ
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 7: // Địa Chỉ
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 8: // Học vị
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 9: // Hệ số lương
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 10: // Mức thanh toán
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 11: // Thành tiền
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 12: // Trừ thuế TNCN 10%
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 13: // Còn lại
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                    }
                });

                totalSoTiet += item.SoTiet;
                totalSoTien += soTien;
                totalTruThue += truThue;
                totalThucNhan += thucNhan;
            });

            // Thêm hàng tổng cộng
            const totalRow = worksheet.addRow([
                'Tổng cộng', '', '', totalSoTiet, '', '', '', '', '', '',
                totalSoTien, totalTruThue, totalThucNhan
            ]);            totalRow.font = { name: 'Times New Roman', bold: true };
            totalRow.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });

      // Gộp ô cho hàng tổng cộng
      worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);

      // Định dạng viền cho các hàng từ dòng thứ 6 trở đi
      const rowCount = worksheet.lastRow.number;
      for (let i = 7; i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    }

        // Tạo tên file
        let fileName = `PhuLuc_Dot${dot}_Ki${ki}_${namHoc}`;
        if (khoa && khoa !== 'ALL') {
            fileName += `_${khoa}`;
        }
        if (teacherName) {
            fileName += `_${sanitizeFileName(teacherName)}`;
        }
        fileName += '.xlsx';

        // Set headers cho response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);


        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).send("Error exporting data");
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error("Error closing database connection:", error);
            }
        }
    }
};