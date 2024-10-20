const express = require("express");

const createConnection = require("../config/databaseAsync");
const gvmList = require("../services/gvmServices");
require("dotenv").config();
const path = require("path");

const multer = require("multer");
const readXlsxFile = require("read-excel-file/node");

const getImportGvmList = (req, res) => {
  res.render("importGvmList.ejs", { data: [] });
};

// Cấu hình multer để lưu file tải lên trong thư mục 'uploads'
const upload = multer({ dest: "uploads/" });

// Đường dẫn đến thư mục cha
const parentDir = path.join(__dirname, "..");
const p = path.join(parentDir, "..");

let duLieu;
const convertExcelToJSON = (req, res) => {
  const filePath = path.join(p, "/uploads", req.file.filename);

  // Đọc file Excel
  readXlsxFile(filePath)
    .then((rows) => {
      duLieu = rows;

      // Lấy tiêu đề (headers) từ hàng đầu tiên
      const headers = rows[0];

      // Chuyển đổi các hàng còn lại thành các đối tượng
      const data = rows.slice(1).map((row) => {
        return headers.reduce((acc, header, index) => {
          acc[header] = row[index];
          return acc;
        }, {});
      });

      // Render dữ liệu ra view 'importGvmList.ejs' và truyền dữ liệu vào
      res.render("importGvmList.ejs", { data });
    })
    .catch((error) => {
      console.error("Lỗi khi đọc file:", error);
      res.status(500).send("Đã xảy ra lỗi khi đọc file!");
    });
};

// Xử lý
const getArrValue = async (req, res) => {
  // Lấy tiêu đề
  const headers = duLieu[0]; // Lấy hàng tiêu đề

  // Lấy tất cả các hàng dữ liệu
  const rows = data.slice(1); // Lấy các hàng từ chỉ mục 1 đến cuối

  // Chuyển đổi thành mảng các đối tượng
  const result = rows.map((row) => {
    return headers.reduce((acc, header, index) => {
      acc[header] = row[index];
      return acc;
    }, {});
  });
};

// const saveToDB = async (req, res) => {
//   try {
//     const connection = await createConnection(); // Kết nối đến DB
//     const data = JSON.parse(req.body.data); // Lấy dữ liệu từ request (dữ liệu đã render ra)

//     // Lấy Mã giảng viên mời = Mã Khoa + _GVM_ + id
//     const role = req.session.role;
//     const parts = role.split("_"); // Mã khoa

//     const MaPhongBan = parts[0]; // Mã Phòng ban

//     const TinhTrangGiangDay = 1; // Tình trạng giảng dạy

//     if (data && data.length > 0) {
//       for (const row of data) {
//         // const sql = `
//         //   INSERT INTO your_table_name
//         //   (ngay_ky_hop_dong, ky, danh_xung, ho_ten, ngay_sinh, cccd, ngay_cap, noi_cap, dia_chi_cccd, email, ma_so_thue, cap_bac, chuc_vu, he_so_luong, dien_thoai, so_tai_khoan, tai_ngan_hang, thoi_gian_thuc_hien, so_tiet, so_tien, tru_thue, thuc_nhan, ngay_nghiem_thu)
//         //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         // `;

//         const sql = `
//         INSERT INTO gvmoi
//         (GioiTinh, MaGvm, HoTen, NgaySinh, CCCD, NgayCapCCCD, NoiCapCCCD, DiaChi, Email, MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, MaPhongBan, TinhTrangGiangDay)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `;

//         const gvms = await gvmList.getGvmLists(req, res);
//         length = parseInt(gvms.length) + 1;

//         const MaGvm = MaPhongBan + "_GVM_" + length;

//         // Chuyển đổi dữ liệu để phù hợp với cột trong DB
//         const GioiTinh = row["Danh xưng"] === "Ông" ? "Nam" : "Nữ";
//         const HoTen = row["Họ và tên"];
//         const NgaySinh = row["Ngày sinh"];
//         const CCCD = row["CCCD"];
//         const NgayCapCCCD = row["Ngày cấp"];
//         const NoiCapCCCD = row["Nơi cấp"];
//         const DiaChi = row["Địa chỉ theo CCCD"];
//         const Email = row["Email"];
//         const MaSoThue = row["Mã số thuế"];
//         const HocVi = row["Cấp bậc"];
//         const ChucVu = row["Chức vụ"];
//         const HSL = row["Hệ số lương"];
//         const DienThoai = row["Điện thoại"];
//         const STK = row["Số tài khoản"];
//         const NganHang = row["Tại ngân hàng"];

//         const values = [
//           GioiTinh,
//           MaGvm,
//           HoTen,
//           NgaySinh,
//           CCCD,
//           NgayCapCCCD,
//           NoiCapCCCD,
//           DiaChi,
//           Email,
//           MaSoThue,
//           HocVi,
//           ChucVu,
//           HSL,
//           DienThoai,
//           STK,
//           NganHang,
//           MaPhongBan,
//           TinhTrangGiangDay,
//         ];

//         gvms.forEach((gvm, index) => {
//           if (gvm.CCCD == CCCD) {
//             if (gvm.MaPhongBan == MaPhongBan) {
//               return res.status(400).json({ message: `CCCD ${CCCD} bị trùng` });
//             }
//             gvm.MaPhongBan += `, ${MaPhongBan}`;
//             return;
//           }
//         });

//         await connection.query(sql, values);
//       }
//       // Gửi phản hồi thành công
//       res.json({ message: "Dữ liệu đã được lưu thành công vào database!" });
//       //res.send("Dữ liệu đã được lưu thành công vào database!");
//     } else {
//       // Gửi phản hồi lỗi nếu không có dữ liệu
//       res.status(400).json({ message: "Không có dữ liệu để lưu." });
//       //res.status(400).send("Không có dữ liệu để lưu.");
//     }
//   } catch (error) {
//     console.error("Lỗi khi lưu dữ liệu vào database:", error);
//     res.status(500).send("Đã xảy ra lỗi khi lưu dữ liệu vào database!");
//   }
// };

const saveToDB = async (req, res) => {
  try {
    const connection = await createConnection(); // Kết nối đến DB
    const data = JSON.parse(req.body.data); // Lấy dữ liệu từ request (dữ liệu đã render ra)

    // Lấy Mã giảng viên mời = Mã Khoa + _GVM_ + id

    const MaPhongBan = req.session.MaPhongBan;
    const TinhTrangGiangDay = 1; // Tình trạng giảng dạy

    if (data && data.length > 0) {
      for (const row of data) {
        // const sql = `
        //   INSERT INTO gvmoi
        //   (GioiTinh, MaGvm, HoTen, NgaySinh, CCCD, NgayCapCCCD, NoiCapCCCD, DiaChi, Email, MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, MaPhongBan, TinhTrangGiangDay)
        //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        // `;
        const sql = `
        INSERT INTO gvmoi
        (GioiTinh, MaGvm, HoTen, NgaySinh, BangTotNghiepLoai, NoiCongTac, MonGiangDayChinh, DiaChi, Email, MaSoThue, HocVi, ChucVu, HSL, DienThoai, STK, NganHang, TinhTrangGiangDay, CCCD, NgayCapCCCD, NoiCapCCCD)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const gvms = await gvmList.getGvmLists(req, res);
        let length = parseInt(gvms.length) + 1;

        const MaGvm = MaPhongBan + "_GVM_" + length;

        // Chuyển đổi dữ liệu để phù hợp với cột trong DB
        const GioiTinh = row["Danh xưng"] === "Ông" ? "Nam" : "Nữ";
        const HoTen = row["Họ và tên"];
        //const GioiTinh = row["Giới tính"];
        const NgaySinh = row["Ngày sinh"];
        const CCCD = row["CCCD"];
        const NgayCapCCCD = row["Ngày cấp"];
        const NoiCapCCCD = row["Nơi cấp"];
        const DiaChi = row["Địa chỉ theo CCCD"];
        const Email = row["Email"];
        const MaSoThue = row["Mã số thuế"];
        const HocVi = row["Cấp bậc"];
        const ChucVu = row["Chức vụ"];
        const HSL = row["Hệ số lương"];
        const DienThoai = row["Điện thoại"];
        const STK = row["Số tài khoản"];
        const NganHang = row["Tại ngân hàng"];
        const NoiCongTac = row["Nơi công tác"];
        const MonGiangDayChinh = row["Bộ môn"] || " ";
        const BangTotNghiepLoai = row["Bằng loại"] || " ";

        //

        //const HocVi = row["Cấp bậc"];

        let isDuplicate = false;

        // Kiểm tra trùng CCCD
        for (const gvm of gvms) {
          if (gvm.CCCD === CCCD) {
            return res.status(400).json({
              message: `Giảng viên mời ${HoTen} với CCCD ${CCCD} bị trùng, dữ liệu từ giảng viên này sẽ không được nhập`,
            });

            //MaPhongBan = null;
            // isDuplicate = true;
            // break;
          }
        }
        // for (const gvm of gvms) {
        //   if (gvm.CCCD === CCCD) {
        //     if (gvm.MaPhongBan === MaPhongBan) {
        //       // Nếu CCCD và MaPhongBan trùng
        //       return res.status(400).json({
        //         message: `CCCD ${CCCD} bị trùng trong cùng Phòng ban`,
        //       });
        //     }
        //     const query = `UPDATE gvmoi SET MaPhongBan = ? where id_Gvm = ?`;
        //     // Nối thêm MaPhongBan nếu CCCD trùng nhưng MaPhongBan khác
        //     const MaPhongBan2 = `${gvm.MaPhongBan},${MaPhongBan}`;

        //     await connection.query(query, [MaPhongBan2, gvm.id_Gvm]);
        //     //MaPhongBan = null;
        //     isDuplicate = true;
        //     break;
        //   }
        // }

        const values = [
          GioiTinh,
          MaGvm,
          HoTen,
          NgaySinh,
          BangTotNghiepLoai,
          NoiCongTac,
          MonGiangDayChinh,
          DiaChi,
          Email,
          MaSoThue,
          HocVi,
          ChucVu,
          HSL,
          DienThoai,
          STK,
          NganHang,
          //MaPhongBan,
          TinhTrangGiangDay,
          CCCD,
          NgayCapCCCD,
          NoiCapCCCD,
        ];

        await connection.query(sql, values);

        // if (!isDuplicate) {
        //   // Thêm mới vào DB
        //   await connection.query(sql, values);
        // }
      }

      // Gửi phản hồi thành công
      res.json({ message: "Dữ liệu đã được lưu thành công vào database!" });
    } else {
      // Gửi phản hồi lỗi nếu không có dữ liệu
      res.status(400).json({ message: "Không có dữ liệu để lưu." });
    }
  } catch (error) {
    console.error("Lỗi khi lưu dữ liệu vào database:", error);
    if (!res.headersSent) {
      res.status(500).send("Đã xảy ra lỗi khi lưu dữ liệu vào database!");
    }
  }
};

// Xuất các hàm để sử dụng trong router
module.exports = {
  getImportGvmList,
  convertExcelToJSON,
  getArrValue,
  saveToDB,
};
