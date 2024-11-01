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
            worksheet.mergeCells(`A${titleRow0.number}:C${titleRow0.number}`);

            // Cập nhật vị trí tiêu đề "Học Viện Kỹ thuật Mật Mã"
            const titleRow1 = worksheet.addRow(['Học Viện Kỹ thuật Mật Mã']);
            titleRow1.font = { name: 'Times New Roman', bold: true, size: 20 };
            titleRow1.alignment = { vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow1.number}:F${titleRow1.number}`);

            const titleRow2 = worksheet.addRow(['Phụ lục']);
            titleRow2.font = { name: 'Times New Roman', bold: true, size: 14 };
            titleRow2.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow2.number}:K${titleRow2.number}`);

            const titleRow3 = worksheet.addRow(['Hợp đồng số:    /HĐ-ĐT ngày   tháng   năm']);
            titleRow3.font = { name: 'Times New Roman', bold: true, size: 14 };
            titleRow3.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow3.number}:K${titleRow3.number}`);

            const titleRow4 = worksheet.addRow(['Kèm theo biên bản nghiệm thu và thanh lý Hợp đồng số:     /HĐ-ĐT ngày  tháng  năm ']);
            titleRow4.font = { name: 'Times New Roman', bold: true, size: 14 };
            titleRow4.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow4.number}:K${titleRow4.number}`);

            // Đặt vị trí cho tiêu đề "Đơn vị tính: Đồng" vào cột J đến L
            const titleRow5 = worksheet.addRow(['', '', '', '', '', '', '', '', '', 'Đơn vị tính: Đồng', '', '']);
            titleRow5.font = { name: 'Times New Roman', bold: true, size: 10 };
            titleRow5.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`J${titleRow5.number}:L${titleRow5.number}`);

            // Định nghĩa tiêu đề cột
            const header = [
                'Họ Tên', 'Học Vị', 'Lớp', 'Số Tiết', 'Tên Học Phần',
                'HK', 'Thời Gian Thực Hiện', 'HSL', 'Mức thanh toán',
                'Số Tiền', 'Trừ Thuế', 'Thực Nhận'
            ];

            // Thêm tiêu đề cột
            const headerRow = worksheet.addRow(header);
            headerRow.font = { name: 'Times New Roman', bold: true };

            // Căn chỉnh độ rộng cột
            worksheet.getColumn(1).width = 19;  // Họ Tên
            worksheet.getColumn(2).width = 9;  // Học Vị
            worksheet.getColumn(3).width = 10;  // Lớp
            worksheet.getColumn(4).width = 9;  // Số Tiết
            worksheet.getColumn(5).width = 25;  // Tên Học Phần
            worksheet.getColumn(6).width = 10;  // HK
            worksheet.getColumn(7).width = 20;  // Thời Gian Thực Hiện
            worksheet.getColumn(8).width = 8;  // HSL
            worksheet.getColumn(9).width = 12;  // Mức thanh toán
            worksheet.getColumn(10).width = 12; // Số Tiền
            worksheet.getColumn(11).width = 12; // Trừ Thuế
            worksheet.getColumn(12).width = 12; // Thực Nhận

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
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; // Bật wrapText cho tiêu đề
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
                row.font = { name: 'Times New Roman', size: 12 }; // Chỉnh cỡ chữ cho toàn bộ hàng

                // Bật wrapText cho các ô dữ liệu và căn giữa
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

                    // Chỉnh cỡ chữ cho từng cột
                    switch (colNumber) {
                        case 1: // Họ Tên
                            cell.font = { name: 'Times New Roman', size: 11 }; 
                            break;
                        case 2: // Học Vị
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 3: // Lớp
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 4: // Số Tiết
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 5: // Tên Học Phần
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 6: // HK
                            cell.font = { name: 'Times New Roman', size: 9 };
                            break;
                        case 7: // Thời Gian Thực Hiện
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 8: // HSL
                            cell.font = { name: 'Times New Roman', size: 10 };
                            break;
                        case 9: // Mức thanh toán
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 10: // Số Tiền
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 11: // Trừ Thuế
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                        case 12: // Thực Nhận
                            cell.font = { name: 'Times New Roman', size: 11 };
                            break;
                    }
                });

                totalSoTiet += item.SoTiet;
                totalSoTien += soTien;
                totalTruThue += truThue;A
                totalThucNhan += thucNhan;
            });

            // Thêm hàng tổng cộng
            const totalRow = worksheet.addRow(['Tổng cộng', '', '', totalSoTiet, '', '', '', '', '', totalSoTien, totalTruThue, totalThucNhan]);
            totalRow.font = { name: 'Times New Roman', bold: true };
            totalRow.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Căn giữa hàng tổng cộng
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
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            }
        }

        // Lưu file Excel
        const filePath = 'src/public/exports/PhuLucGiangVienMoi.xlsx';
        await workbook.xlsx.writeFile(filePath);

        // Gửi file cho client
        res.download(filePath, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                res.status(500).send("Error downloading file");
            }
        });
    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).send("Error exporting data");
    } finally {
        if (connection) {
            connection.end(); // Đóng kết nối đến database
        }
    }
};
