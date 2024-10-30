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
            worksheet.mergeCells(`A${titleRow2.number}:L${titleRow2.number}`);

            const titleRow3 = worksheet.addRow(['Hợp đồng số:    /HĐ-ĐT ngày   tháng   năm']);
            titleRow3.font = { name: 'Times New Roman', bold: true, size: 14 };
            titleRow3.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow3.number}:L${titleRow3.number}`);

            const titleRow4 = worksheet.addRow(['Kèm theo biên bản nghiệm thu và thanh lý Hợp đồng số:     /HĐ-ĐT ngày  tháng  năm ']);
            titleRow4.font = { name: 'Times New Roman', bold: true, size: 14 };
            titleRow4.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`A${titleRow4.number}:L${titleRow4.number}`);

            // Đặt vị trí cho tiêu đề "Đơn vị tính: Đồng" vào cột J đến L
            const titleRow5 = worksheet.addRow(['', '', '', '', '', '', '', '', '', 'Đơn vị tính: Đồng', '', '']);
            titleRow5.font = { name: 'Times New Roman', bold: true, size: 10 };
            titleRow5.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`J${titleRow5.number}:L${titleRow5.number}`);


            // Định nghĩa tiêu đề cột
            const header = [
                'Họ Tên', 'Học Vị', 'Lớp', 'Số Tiết', 'Tên Học Phần',
                'HK', 'Thời Gian Thực Hiện', 'Hệ Số Lương', 'Mức thanh toán',
                'Số Tiền', 'Trừ Thuế', 'Thực Nhận'
            ];

            // Thêm tiêu đề cột
            const headerRow = worksheet.addRow(header);
            headerRow.font = { name: 'Times New Roman', bold: true };

            // Đặt cỡ chữ riêng cho từng tiêu đề cột
            headerRow.getCell(1).font = { name: 'Times New Roman', size: 11 }; // Họ Tên
            headerRow.getCell(2).font = { name: 'Times New Roman', size: 8 }; // Học Vị
            headerRow.getCell(3).font = { name: 'Times New Roman', size: 9 }; // Lớp
            headerRow.getCell(4).font = { name: 'Times New Roman', size: 9 }; // Số Tiết
            headerRow.getCell(5).font = { name: 'Times New Roman', size: 10 }; // Tên Học Phần
            headerRow.getCell(6).font = { name: 'Times New Roman', size: 8 }; // Học Kỳ
            headerRow.getCell(7).font = { name: 'Times New Roman', size: 10 }; // Thời Gian Thực Hiện
            headerRow.getCell(8).font = { name: 'Times New Roman', size: 9 }; // Hệ Số Lương
            headerRow.getCell(9).font = { name: 'Times New Roman', size: 9 }; // Mức thanh toán
            headerRow.getCell(10).font = { name: 'Times New Roman', size: 11 }; // Số Tiền
            headerRow.getCell(11).font = { name: 'Times New Roman', size: 11 }; // Trừ Thuế
            headerRow.getCell(12).font = { name: 'Times New Roman', size: 11 }; // Thực Nhận

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
            worksheet.getColumn('A').width = 16; // Chiều rộng cột "Họ Tên"
            worksheet.getColumn('B').width = 9; // Chiều rộng cột "Học vị"


            worksheet.getColumn('D').width = 9; // Chiều rộng cột "Số Tiết"
            worksheet.getColumn('F').width = 6; // Chiều rộng cột "Học Kỳ"
            worksheet.getColumn('I').width = 8; // Chiều rộng cột "Hệ Số Lương"
            worksheet.getColumn('J').width = 10; // Chiều rộng cột "Mức thanh toán"
            worksheet.getColumn('K').width = 13; // Chiều rộng cột "Số Tiền"
            worksheet.getColumn('L').width = 13; // Chiều rộng cột "Trừ Thuế"
            worksheet.getColumn('M').width = 13; // Chiều rộng cột "Thực Nhận"

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
        res.download(filePath);
    } catch (error) {
        console.error("Error exporting data: ", error);
        res.status(500).send("Error exporting data");
    } finally {
        if (connection) {
            connection.end();
        }
    }
};
