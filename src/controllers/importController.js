const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const connection = require("../controllers/connectDB");
const { json, query } = require("express");
const gvms = require("../services/gvmServices");
const nhanviens = require("../services/nhanvienServices");

// Hàm chuyển đổi tệp Excel sang JSON
const convertExcelToJSON = (filePath) => {
  try {
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

    console.log(jsonObjects);

    return jsonObjects;
  } catch (err) {
    throw new Error("Cannot read file!: " + err.message);
  }
};

const importTableQC = async (jsonData) => {
  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"

  function tachChuoi(chuoi) {
    // Kiểm tra đầu vào
    if (typeof chuoi !== "string" || chuoi.trim() === "") {
      return {
        TenLop: "",
        HocKi: null,
        NamHoc: null,
        Lop: "",
      };
    }

    // Sử dụng biểu thức chính quy để tách chuỗi
    const regex = /^(.*?)(?:\s*\((.*?)\))?-(\d+)-(\d+)\s*\((.*?)\)$/; // Tách các phần
    const match = chuoi.match(regex);

    if (!match) {
      // Trường hợp không khớp với định dạng
      const regexFallback = /^(.*?)(?:\s*\((.*?)\))?$/; // Trường hợp không có học kỳ và năm
      const fallbackMatch = chuoi.match(regexFallback);
      if (fallbackMatch) {
        const tenHP = fallbackMatch[1].trim(); // Tên học phần
        const Lop = fallbackMatch[2] ? fallbackMatch[2].trim() : ""; // Lớp
        return {
          TenLop: tenHP,
          HocKi: null, // Thay đổi giá trị mặc định
          NamHoc: null, // Thay đổi giá trị mặc định
          Lop,
        };
      }

      return {
        TenLop: "",
        HocKi: null,
        NamHoc: null,
        Lop: "",
      };
    }

    // Lấy các thông tin từ kết quả match
    const tenHP = match[1].trim(); // Tên học phần
    const HocKi = match[3] ? match[3].trim() : null; // Học kỳ
    const namHoc = match[4].trim(); // Năm học kèm lớp
    const NamHoc = "20" + namHoc; // Tạo năm học từ phần thứ ba
    const Lop = match[5] ? match[5].trim() : ""; // Lớp

    return {
      TenLop: tenHP,
      HocKi,
      NamHoc,
      Lop,
    };
  }
  // Tạo câu lệnh INSERT động với các trường đầy đủ
  const queryInsert = `
    INSERT INTO ${tableName} (
      Khoa,
      Dot,
      KiHoc,
      NamHoc,
      GiaoVien, 
      GiaoVienGiangDay, 
      MoiGiang, 
      SoTinChi, 
      MaHocPhan, 
      LopHocPhan,
      TenLop, 
      LL, 
      SoTietCTDT, 
      HeSoT7CN, 
      SoSinhVien, 
      HeSoLopDong, 
      QuyChuan, 
      GhiChu
    ) VALUES (?, ?, ?, ?, ?, NULL, FALSE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const insertPromises = jsonData.map((item) => {
    return new Promise((resolve, reject) => {
      // Sử dụng hàm tachChuoi để tách các thông tin từ chuỗi
      const { TenLop, HocKi, NamHoc, Lop } = tachChuoi(item["LopHocPhan"]);

      const values = [
        item["Khoa"], // Khoa
        item["Dot"], // Đợt
        item["Ki"], // Đợt
        item["Nam"], // Đợt
        item["GiaoVien"], // Tên Giảng viên
        item["SoTinChi"], // Số tín chỉ
        item["MaHocPhan"], // Mã học phần
        TenLop, // Lớp học phần (được tách từ chuỗi)
        Lop,
        item["LL"], // LL (Số tiết theo lịch)
        item["SoTietCTDT"], // Số tiết theo CTĐT
        item["HeSoT7CN"], // Hệ số T7/CN
        item["SoSinhVien"], // Số sinh viên
        item["HeSoLopDong"], // Hệ số lớp đông
        item["QuyChuan"], // Quy chuẩn
        item["GhiChu"], // Ghi chú
      ];

      connection.query(queryInsert, values, (err, results) => {
        if (err) {
          console.error("Error:", err);
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

    // Chạy câu lệnh UPDATE sau khi INSERT thành công
    const queryUpdate = `
      UPDATE ${tableName}
      SET MaHocPhan = CONCAT(Khoa, id);
    `;

    await new Promise((resolve, reject) => {
      connection.query(queryUpdate, (err, results) => {
        if (err) {
          console.error("Error while updating:", err);
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    results = true;
  } catch (error) {
    console.error("Error:", error);
  }

  return results;
};

// Hàm nhập dữ liệu vào bảng quychuan
const importTableTam = async (jsonData) => {
  const tableName = process.env.DB_TABLE_TAM; // Giả sử biến này có giá trị là "quychuan"

  // Tạo câu lệnh INSERT động
  const query = `
    INSERT INTO ${tableName} (
      Khoa,
      Dot,
      Ki,
      Nam,
      GiaoVien, 
      SoTinChi, 
      LopHocPhan, 
      LL, 
      SoTietCTDT, 
      HeSoT7CN, 
      SoSinhVien, 
      HeSoLopDong, 
      QuyChuan, 
      GhiChu
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const insertPromises = jsonData.map((item) => {
    return new Promise((resolve, reject) => {
      const values = [
        item["Khoa"], // Khoa
        item["Dot"], // Đợt
        item["Ki"], // Đợt
        item["Nam"], // Đợt
        item["Giáo Viên"], // Tên Giảng viên
        item["Số TC"], // Số tín chỉ
        item["Lớp học phần"], // Lớp học phần
        item["Số tiết lên lớp giờ HC"], // LL (cần xác định từ dữ liệu nếu cần)
        item["Số tiết theo CTĐT"], // Số tiết CTĐT
        item["Hệ số lên lớp ngoài giờ HC/ Thạc sĩ/ Tiến sĩ"], // Hệ số T7/CN
        item["Số SV"], // Số sinh viên
        item["Hệ số lớp đông"], // Hệ số lớp đông
        item["QC"], // Quy chuẩn
        item["Ghi chú"], // Ghi chú
      ];

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error("Error:", err);
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
    console.error("Error:", error);
  }

  return results;
};

const importJSONToDB = async (jsonData) => {
  const tableLopName = "lop"; // Tên bảng lop
  const tableHocPhanName = "hocphan"; // Tên bảng hocphan
  const tableGiangDayName = "giangday"; // Tên bảng giangday

  // Các cột cho bảng lop
  const columnMaLop = "MaLop"; // Mã lớp
  const columnTenLop = "TenLop"; // Tên lớp
  const columnSoSinhVien = "SoSinhVien"; // Số sinh viên
  const columnNam = "NamHoc"; // Năm học
  const columnHocKi = "HocKi"; // Học kỳ
  const columnHeSoSV = "HeSoSV"; // Hệ số sinh viên

  // Các cột cho bảng hocphan
  const columnMaHocPhan = "MaHocPhan"; // Mã học phần
  const columnTenHocPhan = "TenHocPhan"; // Tên học phần
  const columnDVHT = "DVHT"; // Số tín chỉ

  // Các cột cho bảng giangday
  const columnIdUser = "id_User"; // ID Giảng viên
  const columnMaHocPhanGiangDay = "MaHocPhan"; // Mã học phần
  const columnMaLopGiangDay = "MaLop"; // Mã lớp
  const columnIdGVM = "Id_Gvm"; // ID giảng viên mời
  const columnGiaoVien = "GiaoVien"; // Tên Giảng viên
  const columnLenLop = "LenLop"; // LL
  const columnHeSoT7CN = "HeSoT7CN"; // Hệ số T7/CN
  const columnSoTietCTDT = "SoTietCTDT"; // Số tiết CTĐT

  function tachChuoi(chuoi) {
    // Tách chuỗi bằng dấu "-" để lấy các phần
    const parts = chuoi.split("-");

    // Lấy phần đầu tiên và phần thứ hai, dừng lại trước cặp ngoặc
    const tenHP = parts[0].trim(); // Tên học phần
    const HocKi = parts[1] ? parts[1].trim() : ""; // Học kỳ
    const namHocLop = parts[2] ? parts[2].split("(")[0].trim() : ""; // Lấy năm học kèm lớp, dừng trước ngoặc

    const NamHoc = "20" + namHocLop.substring(0, 2).trim(); // Lấy 2 ký tự đầu của năm học
    const LopMatch = chuoi.match(/\(([^)]+)\)/); // Tìm lớp trong ngoặc
    const Lop = LopMatch ? LopMatch[1] : ""; // Nếu tìm thấy, lấy lớp, nếu không để rỗng

    return {
      TenLop: tenHP,
      HocKi: HocKi,
      NamHoc,
      Lop,
    };
  }

  const getIdUserByTeacherName = async (teacherName) => {
    return new Promise((resolve, reject) => {
      // Sử dụng cú pháp truy vấn đơn giản
      const query = `SELECT id_User FROM nhanvien WHERE TenNhanVien = '${teacherName}';`;

      connection.query(query, (err, results) => {
        if (err) {
          console.error("Lỗi khi truy vấn bảng nhanvien:", err);
          reject(err);
          return;
        }

        // Nếu không tìm thấy Giảng viên
        if (results.length === 0) {
          resolve(null); // Không tìm thấy, trả về null
        } else {
          resolve(results[0].id_User); // Lấy id_User của Giảng viên
        }
      });
    });
  };

  let index = 1;

  const insertPromises = jsonData.map(async (item) => {
    const chuoi = item["Lớp học phần"];
    const { TenLop, HocKi, NamHoc, Lop } = tachChuoi(chuoi);
    const tenGv = item["Giáo Viên"];
    const id_User = await getIdUserByTeacherName(tenGv); // Chờ lấy id_User

    // // Tách lớp học phần
    // console.log('test');
    // console.log(TenLop);
    // console.log(HocKi);
    // console.log(NamHoc);
    // console.log(Lop);

    if (id_User != null) {
      const insertLopPromise = new Promise((resolve, reject) => {
        const queryLop = `INSERT INTO ${tableLopName} 
          (${columnMaLop}, ${columnTenLop}, ${columnSoSinhVien}, ${columnNam}, ${columnHocKi}, ${columnHeSoSV}) 
          VALUES (?, ?, ?, ?, ?, ?)`;

        connection.query(
          queryLop,
          [
            index, // Mã lớp đã tách
            TenLop, // Tên lớp
            item["Số SV"], // Số sinh viên từ JSON
            NamHoc, // Năm học
            HocKi, // Học kỳ
            item["Hệ số lớp đông"], // Hệ số sinh viên từ JSON
          ],
          (err, results) => {
            if (err) {
              console.error("Lỗi khi thêm vào bảng lop:", err);
              reject(err);
              return;
            }
            resolve(results);
          }
        );
      });

      const insertHocPhanPromise = new Promise((resolve, reject) => {
        const queryHocPhan = `INSERT INTO ${tableHocPhanName} 
          (${columnMaHocPhan}, ${columnTenHocPhan}, ${columnDVHT}) 
          VALUES (?, ?, ?)`;

        connection.query(
          queryHocPhan,
          [
            index, // Mã học phần là mã lớp đã tách
            TenLop, // Tên học phần là tên lớp
            item["Số TC"], // DVHT là số tín chỉ
          ],
          (err, results) => {
            if (err) {
              console.error("Lỗi khi thêm vào bảng hocphan:", err);
              reject(err);
              return;
            }
            resolve(results);
          }
        );
      });

      const insertGiangDayPromise = new Promise((resolve, reject) => {
        const queryGiangDay = `INSERT INTO ${tableGiangDayName} 
          (${columnIdUser}, ${columnMaHocPhanGiangDay}, ${columnMaLopGiangDay}, ${columnIdGVM}, ${columnGiaoVien}, ${columnLenLop}, ${columnHeSoT7CN}, ${columnSoTietCTDT}) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(
          queryGiangDay,
          [
            id_User, // ID Giảng viên
            index, // Mã học phần
            index, // mã lớp
            index, // id gvm
            item["Giáo Viên"], // Tên Giảng viên
            item["LL"], // LL
            item["Hệ số T7/CN"], // Hệ số T7/CN
            item["Số tiết CTĐT"], // Số tiết CTĐT
          ],
          (err, results) => {
            if (err) {
              console.error("Lỗi khi thêm vào bảng giangday:", err);
              reject(err);
              return;
            }
            resolve(results);
          }
        );
      });

      index++; // Tăng index sau khi hoàn thành các thao tác với item hiện tại
      return Promise.all([
        insertLopPromise,
        insertHocPhanPromise,
        insertGiangDayPromise,
      ]);
    }
  });

  try {
    await Promise.all(insertPromises);
    results = true;
  } catch (error) {
    console.error("Lỗi tổng quát:", error);
    results = false;
  }

  return results;
};

const handleUploadAndRender = async (req, res) => {
  const filePath = path.join(__dirname, "../../uploads", req.file.filename);

  // Chuyển đổi file Excel sang JSON
  const jsonResult = convertExcelToJSON(filePath);

  // render bảng
  res.send(jsonResult);
};

const checkExistKhoa = async (req, res) => {
  const { khoa } = req.body; // Lấy giá trị Khoa từ yêu cầu client
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường

  // Câu truy vấn kiểm tra sự tồn tại của giá trị Khoa trong bảng
  const queryCheck = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE Khoa = ?) AS exist;`;

  // Sử dụng Promise để kiểm tra sự tồn tại
  return new Promise((resolve, reject) => {
    connection.query(queryCheck, [khoa], (err, results) => {
      if (err) {
        console.error("Lỗi khi kiểm tra Khoa:", err);
        return reject(
          res.status(500).json({ error: "Lỗi kiểm tra cơ sở dữ liệu" })
        );
      }

      // Kết quả trả về từ cơ sở dữ liệu
      const exist = results[0].exist === 1; // True nếu tồn tại, False nếu không tồn tại

      if (exist) {
        return resolve(
          res.status(200).json({
            message: "Khoa đã tồn tại trong cơ sở dữ liệu",
            exists: true,
          })
        );
      } else {
        return resolve(
          res.status(200).json({
            message: "Khoa không tồn tại trong cơ sở dữ liệu",
            exists: false,
          })
        );
      }
    });
  });
};

// Hàm xóa row theo trường 'Khoa'
const deleteRowByKhoa = (req, res) => {
  const { khoa } = req.body; // Nhận giá trị từ client thông qua body
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường
  if (!khoa) {
    return res.status(400).json({ message: "Missing required field: Khoa" });
  }

  // Query SQL để xóa row
  const sql = `DELETE FROM ${tableName} WHERE Khoa = ?`;

  connection.query(sql, [khoa], (err, results) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Error executing query", error: err });
    }

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No row found with the given Khoa" });
    }

    return res.status(200).json({ message: "Row deleted successfully" });
  });
};

const updateChecked = async (req, res) => {
  const role = req.session.role;

  const duyet = process.env.DUYET;

  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"

  if (role == duyet) {
    const jsonData = req.body; // Lấy dữ liệu từ req.body

    // Tạo mảng các Promise cho từng item trong jsonData
    const updatePromises = jsonData.map((item) => {
      return new Promise((resolve, reject) => {
        const {
          Khoa,
          Dot,
          KiHoc,
          NamHoc,
          GiaoVien,
          GiaoVienGiangDay,
          MoiGiang,
          SoTinChi,
          MaHocPhan,
          LopHocPhan,
          TenLop,
          BoMon,
          LL,
          SoTietCTDT,
          HeSoT7CN,
          SoSinhVien,
          HeSoLopDong,
          QuyChuan,
          GhiChu,
          KhoaDuyet,
          DaoTaoDuyet,
          TaiChinhDuyet,
          NgayBatDau,
          NgayKetThuc,
        } = item;
        const ID = item.ID;
        // Xây dựng câu lệnh cập nhật
        const queryUpdate = `
         UPDATE ${tableName}
SET 
    Khoa = ?, 
    Dot = ?, 
    KiHoc = ?, 
    NamHoc = ?, 
    GiaoVien = ?, 
    GiaoVienGiangDay = ?, 
    MoiGiang = ?, 
    SoTinChi = ?, 
    MaHocPhan = ?, 
    LopHocPhan = ?, 
    TenLop = ?, 
    BoMon = ?, 
    LL = ?, 
    SoTietCTDT = ?, 
    HeSoT7CN = ?, 
    SoSinhVien = ?, 
    HeSoLopDong = ?, 
    QuyChuan = ?, 
    GhiChu = ?,
    KhoaDuyet = ?,
    DaoTaoDuyet = ?,
    TaiChinhDuyet = ?,
    NgayBatDau = ?,
    NgayKetThuc = ?
WHERE ID = ${ID}
AND (KhoaDuyet = FALSE OR DaoTaoDuyet = FALSE OR TaiChinhDuyet = FALSE);  -- Điều kiện cập nhật
        `;

        // Tạo mảng các giá trị tương ứng với câu lệnh
        const values = [
          Khoa,
          Dot,
          KiHoc,
          NamHoc,
          GiaoVien,
          GiaoVienGiangDay,
          MoiGiang,
          SoTinChi,
          MaHocPhan,
          LopHocPhan,
          TenLop,
          BoMon,
          LL,
          SoTietCTDT,
          HeSoT7CN,
          SoSinhVien,
          HeSoLopDong,
          QuyChuan,
          GhiChu,
          KhoaDuyet,
          DaoTaoDuyet,
          TaiChinhDuyet,
          NgayBatDau,
          NgayKetThuc,
        ];

        // console.log(values[0]);

        // Thực hiện truy vấn cập nhật
        connection.query(queryUpdate, values, (err, results) => {
          if (err) {
            console.error("Error:", err);
            reject(err);
            return;
          }
          resolve(results);
        });
      });
    });

    try {
      await Promise.all(updatePromises);
      console.log("Cập nhật thành công");
      res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật dữ liệu" });
    }
  } else {
    res
      .status(403)
      .json({ error: "Bạn không có quyền thực hiện hành động này" });
  }
};

const updateQC = async (req, res) => {
  const role = req.session.role;
  const duyet = process.env.DUYET;

  // Kiểm tra xem người dùng có quyền thực hiện hành động này không
  if (role == duyet) {
    return res
      .status(403)
      .json({ error: "Bạn không có quyền thực hiện hành động này" });
  }

  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"
  const jsonData = req.body; // Lấy dữ liệu từ req.body

  // Hàm trợ giúp để promisify connection.query
  const queryAsync = (query, values) => {
    return new Promise((resolve, reject) => {
      connection.query(query, values, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  };

  try {
    // Biến để lưu các ID đã hoàn thiện
    let completedIDs = [];

    // Duyệt qua từng phần tử trong jsonData
    console.log("data = ", jsonData);
    for (let item of jsonData) {
      const {
        ID,
        Khoa,
        Dot,
        KiHoc,
        NamHoc,
        GiaoVien,
        GiaoVienGiangDay,
        MoiGiang,
        SoTinChi,
        MaHocPhan,
        LopHocPhan,
        TenLop,
        BoMon,
        LL,
        SoTietCTDT,
        HeSoT7CN,
        SoSinhVien,
        HeSoLopDong,
        QuyChuan,
        GhiChu,
        KhoaDuyet,
        DaoTaoDuyet,
        TaiChinhDuyet,
        NgayBatDau,
        NgayKetThuc,
      } = item;

      // Truy vấn kiểm tra nếu bản ghi đã được duyệt đầy đủ
      const approvalQuery = `SELECT KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet FROM ${tableName} WHERE ID = ?`;
      const approvalResult = await queryAsync(approvalQuery, [ID]);

      if (approvalResult.length > 0) {
        const { KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet } = approvalResult[0];

        // Kiểm tra nếu tất cả 3 cột đều được duyệt
        if (KhoaDuyet === 1 && DaoTaoDuyet === 1 && TaiChinhDuyet === 1) {
          // Thêm ID vào danh sách hoàn thiện
          completedIDs.push(ID);
          continue; // Bỏ qua bản ghi này và tiếp tục với bản ghi tiếp theo
        }
      }

      // Nếu chưa duyệt đầy đủ, tiến hành cập nhật
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          Khoa = ?, 
          Dot = ?, 
          KiHoc = ?, 
          NamHoc = ?, 
          GiaoVien = ?, 
          GiaoVienGiangDay = ?, 
          MoiGiang = ?, 
          SoTinChi = ?, 
          MaHocPhan = ?, 
          LopHocPhan = ?, 
          TenLop = ?, 
          BoMon = ?, 
          LL = ?, 
          SoTietCTDT = ?, 
          HeSoT7CN = ?, 
          SoSinhVien = ?, 
          HeSoLopDong = ?, 
          QuyChuan = ?, 
          GhiChu = ?,
          KhoaDuyet = ?,
          DaoTaoDuyet = ?,
          TaiChinhDuyet = ?,
          NgayBatDau = ?,
          NgayKetThuc = ?
        WHERE ID = ?
          AND (KhoaDuyet = 0 OR DaoTaoDuyet = 0 OR TaiChinhDuyet = 0)
      `;

      const updateValues = [
        Khoa,
        Dot,
        KiHoc,
        NamHoc,
        GiaoVien,
        GiaoVienGiangDay,
        MoiGiang,
        SoTinChi,
        MaHocPhan,
        LopHocPhan,
        TenLop,
        BoMon,
        LL,
        SoTietCTDT,
        HeSoT7CN,
        SoSinhVien,
        HeSoLopDong,
        QuyChuan,
        GhiChu,
        KhoaDuyet,
        DaoTaoDuyet,
        TaiChinhDuyet,
        NgayBatDau,
        NgayKetThuc,
        ID,
      ];

      await queryAsync(updateQuery, updateValues);
    }

    // Trả về thông báo cho các ID đã hoàn thiện
    if (completedIDs.length > 0) {
      return res.status(200).json({
        message: "Dữ liệu đã hoàn thiện, không thể cập nhật",
      });
    }

    // Nếu tất cả cập nhật thành công
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật dữ liệu" });
  }
};

// const updateAllTeachingInfo = async (req, res) => {
//   const query2 = `
//     SELECT
//       qc.*,
//       gvmoi.*,
//       SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
//     FROM quychuan qc
//     JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
//     GROUP BY gvmoi.HoTen;
//   `;

//   const getDanhXung = (gioiTinh) => {
//     return gioiTinh === "Nam" ? "Ông" : gioiTinh === "Nữ" ? "Bà" : "";
//   };

//   try {
//     const [dataJoin] = await connection.promise().query(query2);

//     // Chuẩn bị dữ liệu để chèn từng loạt
//     const insertValues = dataJoin.map((item) => {
//       const {
//         id_Gvm,
//         DienThoai,
//         Email,
//         MaSoThue,
//         HoTen,
//         NgaySinh,
//         HSL,
//         CCCD,
//         NoiCapCCCD,
//         DiaChi,
//         STK,
//         NganHang,
//         NgayBatDau,
//         NgayKetThuc,
//         KiHoc,
//         QuyChuan,
//         //SoTien,
//         //TruThue,
//         Dot,
//         NamHoc,
//         MaPhongBan,
//         //MaBoMon,
//         KhoaDuyet,
//         DaoTaoDuyet,
//         TaiChinhDuyet,
//         GioiTinh,
//       } = item;

//       const DanhXung = getDanhXung(GioiTinh);
//       let SoTien = QuyChuan * 1000000;
//       let TruThue = 0;
//       MaBoMon = 0;
//       return [
//         id_Gvm,
//         DienThoai,
//         Email,
//         MaSoThue,
//         DanhXung,
//         HoTen,
//         NgaySinh,
//         HSL,
//         CCCD,
//         NoiCapCCCD,
//         DiaChi,
//         STK,
//         NganHang,
//         NgayBatDau,
//         NgayKetThuc,
//         KiHoc,
//         QuyChuan,
//         SoTien,
//         TruThue,
//         Dot,
//         NamHoc,
//         MaPhongBan,
//         MaBoMon,
//         KhoaDuyet,
//         DaoTaoDuyet,
//         TaiChinhDuyet,
//       ];
//     });

//     // Định nghĩa câu lệnh chèn
//     const queryInsert = `
//       INSERT INTO hopdonggvmoi (
//         id_Gvm, DienThoai, Email, MaSoThue, DanhXung, HoTen, NgaySinh, HSL, CCCD, NoiCapCCCD,
//         DiaChi, STK, NganHang, NgayBatDau, NgayKetThuc, KiHoc, SoTiet, SoTien, TruThue,
//         Dot, NamHoc, MaPhongBan, MaBoMon, KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet
//       ) VALUES ?;
//     `;

//     // Thực hiện câu lệnh chèn
//     await connection.promise().query(queryInsert, [insertValues]);

//     res.status(200).json({ message: "Dữ liệu đã được chèn thành công!" });
//   } catch (err) {
//     console.error(err); // Ghi lại lỗi để gỡ lỗi
//     res
//       .status(500)
//       .json({ error: "Đã xảy ra lỗi trong quá trình cập nhật thông tin." });
//   }
// };

const getGvmId = async (HoTen) => {
  const query = "SELECT id_Gvm FROM `gvmoi` WHERE HoTen = ?";
  const [rows] = await connection.promise().query(query, [HoTen]);

  return rows[0].id_Gvm;
};

const getNhanvienId = async (HoTen) => {
  const query = "SELECT id_User FROM `nhanvien` WHERE TenNhanVien = ?";
  const [rows] = await connection.promise().query(query, [HoTen]);

  return rows[0].id_User;
};

const hocPhanDaTonTai = async (MaHocPhan) => {
  const query = "SELECT MaHocPhan FROM `hocphan` WHERE MaHocPhan = ?";
  const [rows] = await connection.promise().query(query, [MaHocPhan]);

  return rows.length > 0; // Nếu có ít nhất một kết quả, môn học đã tồn tại
};

const themHocPhan = async (MaHocPhan, TenHocPhan, DVHT, Khoa) => {
  const query = `
    INSERT INTO hocphan (MaHocPhan, TenHocPhan, DVHT, Khoa)
    VALUES (?, ?, ?, ?)
  `;
  const values = [MaHocPhan, TenHocPhan, DVHT, Khoa];

  await connection.promise().query(query, values);
};

// const insertGiangDay = async (req, res) => {
//   const query2 = `
//     SELECT
//       qc.*,
//       gvmoi.*,
//       SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
//     FROM quychuan qc
//     JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
//   `;

//   try {
//     const [dataJoin] = await connection.promise().query(query2);
//     let id_Gvm = 1;
//     let id_User = 1;

//     // Chuẩn bị dữ liệu để chèn từng loạt
//     const insertValues = await Promise.all(
//       dataJoin.map(async (item) => {
//         const {
//           Khoa,
//           MoiGiang,
//           SoTinChi,
//           LopHocPhan,
//           GiaoVien,
//           GiaoVienGiangDay,
//           LL,
//           SoTietCTDT,
//           HeSoT7CN,
//           SoSinhVien,
//           HeSoLopDong,
//           QuyChuan,
//           KiHoc,
//           NamHoc,
//           MaHocPhan,
//           TenLop,
//           Dot,
//         } = item;

//         const TenHocPhan = LopHocPhan;
//         const gv1 = GiaoVienGiangDay ? GiaoVienGiangDay.split(" - ") : [];
//         const gv2 = GiaoVien ? GiaoVien.split(" - ") : [];

//         if (MoiGiang == 1) {
//           // Lấy id_Gvm khi giảng viên mới giảng
//           id_Gvm = await getGvmId(gv1[0]);
//         } else {
//           // Nếu không có giảng viên thì lấy id_User
//           id_User = !GiaoVienGiangDay
//             ? await getNhanvienId(gv2[0])
//             : await getNhanvienId(gv1[0]);
//         }

//         // Kiểm tra môn học đã tồn tại chưa
//         if (!(await hocPhanDaTonTai(MaHocPhan))) {
//           await themHocPhan(MaHocPhan, TenHocPhan, SoTinChi, Khoa);
//         }

//         // Trả về mảng các giá trị đã chờ để đưa vào câu INSERT
//         return [
//           SoTinChi,
//           TenHocPhan,
//           id_User,
//           id_Gvm,
//           LL,
//           SoTietCTDT,
//           HeSoT7CN,
//           SoSinhVien,
//           HeSoLopDong,
//           QuyChuan,
//           KiHoc,
//           NamHoc,
//           MaHocPhan,
//           TenLop,
//         ];
//       })
//     );

//     // Kiểm tra xem có dữ liệu để chèn không
//     if (insertValues.length === 0) {
//       return res.status(400).json({ message: "Không có dữ liệu để chèn!" });
//     }

//     // Định nghĩa câu lệnh chèn
//     const queryInsert = `
//       INSERT INTO giangday (
//         SoTC, TenHocPhan, id_User, id_Gvm, LenLop, SoTietCTDT, HeSoT7CN, SoSV, HeSoLopDong,
//         QuyChuan, HocKy, NamHoc, MaHocPhan, Lop
//       ) VALUES ?;
//     `;

//     // Thực hiện câu lệnh chèn
//     await connection.promise().query(queryInsert, [insertValues]);
//     console.log("done");

//     // Đảm bảo chỉ gửi phản hồi một lần
//     return res
//       .status(200)
//       .json({ message: "Dữ liệu đã được chèn thành công!" });
//   } catch (err) {
//     console.error(err); // Ghi lại lỗi để gỡ lỗi
//     if (!res.headersSent) {
//       return res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi trong quá trình cập nhật thông tin." });
//     }
//   }
// };

// const submitData2 = async (req, res) => {
//   try {
//     await updateAllTeachingInfo(req, res); // Chờ cho hàm này hoàn thành
//     await insertGiangDay(req, res); // Chờ cho hàm này hoàn thành
//     // Có thể thêm một phản hồi sau khi cả hai hàm đã hoàn tất, nếu cần
//     return res.status(200).json({ message: "Cập nhật dữ liệu thành công!" });
//   } catch (error) {
//     console.error(error);
//     // Kiểm tra xem tiêu đề đã được gửi chưa trước khi gửi phản hồi lỗi
//     if (!res.headersSent) {
//       return res
//         .status(500)
//         .json({ error: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu." });
//     }
//   }
// };

// const updateAllTeachingInfo = async () => {
//   const query2 = `
//     SELECT
//       qc.*,
//       gvmoi.*,
//       SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
//     FROM quychuan qc
//     JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
//     GROUP BY gvmoi.HoTen;
//   `;

//   const getDanhXung = (gioiTinh) => {
//     return gioiTinh === "Nam" ? "Ông" : gioiTinh === "Nữ" ? "Bà" : "";
//   };

//   try {
//     const [dataJoin] = await connection.promise().query(query2);

//     // Chuẩn bị dữ liệu để chèn từng loạt
//     const insertValues = dataJoin.map((item) => {
//       const {
//         id_Gvm,
//         DienThoai,
//         Email,
//         MaSoThue,
//         HoTen,
//         NgaySinh,
//         HSL,
//         CCCD,
//         NoiCapCCCD,
//         DiaChi,
//         STK,
//         NganHang,
//         NgayBatDau,
//         NgayKetThuc,
//         KiHoc,
//         QuyChuan,
//         Dot,
//         NamHoc,
//         MaPhongBan,
//         KhoaDuyet,
//         DaoTaoDuyet,
//         TaiChinhDuyet,
//         GioiTinh,
//       } = item;

//       const DanhXung = getDanhXung(GioiTinh);
//       let SoTien = QuyChuan * 1000000;
//       let TruThue = 0;
//       let MaBoMon = 0; // Giả định giá trị mặc định là 0

//       return [
//         id_Gvm,
//         DienThoai,
//         Email,
//         MaSoThue,
//         DanhXung,
//         HoTen,
//         NgaySinh,
//         HSL,
//         CCCD,
//         NoiCapCCCD,
//         DiaChi,
//         STK,
//         NganHang,
//         NgayBatDau,
//         NgayKetThuc,
//         KiHoc,
//         SoTien,
//         TruThue,
//         Dot,
//         NamHoc,
//         MaPhongBan,
//         MaBoMon,
//         KhoaDuyet,
//         DaoTaoDuyet,
//         TaiChinhDuyet,
//       ];
//     });

//     // Định nghĩa câu lệnh chèn
//     const queryInsert = `
//       INSERT INTO hopdonggvmoi (
//         id_Gvm, DienThoai, Email, MaSoThue, DanhXung, HoTen, NgaySinh, HSL, CCCD, NoiCapCCCD,
//         DiaChi, STK, NganHang, NgayBatDau, NgayKetThuc, KiHoc, SoTiet, SoTien, TruThue,
//         Dot, NamHoc, MaPhongBan, MaBoMon, KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet
//       ) VALUES ?;
//     `;

//     // Thực hiện câu lệnh chèn
//     await connection.promise().query(queryInsert, [insertValues]);

//     // Trả về kết quả thành công
//     return { success: true, message: "Dữ liệu đã được chèn thành công!" };
//   } catch (err) {
//     console.error(err); // Ghi lại lỗi để gỡ lỗi
//     return {
//       success: false,
//       message: "Đã xảy ra lỗi trong quá trình cập nhật thông tin.",
//     };
//   }
// };

const updateAllTeachingInfo = async () => {
  const query2 = `
    SELECT
      qc.*, 
      gvmoi.*, 
      SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
    FROM quychuan qc
    JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
    GROUP BY gvmoi.HoTen;
  `;

  const getDanhXung = (gioiTinh) => {
    return gioiTinh === "Nam" ? "Ông" : gioiTinh === "Nữ" ? "Bà" : "";
  };

  try {
    const [dataJoin] = await connection.promise().query(query2);

    // Chuẩn bị dữ liệu để chèn từng loạt
    const insertValues = dataJoin.map((item) => {
      const {
        id_Gvm,
        DienThoai,
        Email,
        MaSoThue,
        HoTen,
        NgaySinh,
        HSL,
        CCCD,
        NoiCapCCCD,
        DiaChi,
        STK,
        NganHang,
        NgayBatDau,
        NgayKetThuc,
        KiHoc,
        QuyChuan,
        Dot,
        NamHoc,
        MaPhongBan,
        KhoaDuyet,
        DaoTaoDuyet,
        TaiChinhDuyet,
        GioiTinh,
      } = item;

      const DanhXung = getDanhXung(GioiTinh);
      let SoTien = QuyChuan * 1000000; // Tính toán số tiền
      let TruThue = 0; // Giả định không thu thuế
      let MaBoMon = 0; // Giả định giá trị mặc định là 0

      return [
        id_Gvm,
        DienThoai,
        Email,
        MaSoThue,
        DanhXung,
        HoTen,
        NgaySinh,
        HSL,
        CCCD,
        NoiCapCCCD,
        DiaChi,
        STK,
        NganHang,
        NgayBatDau,
        NgayKetThuc,
        KiHoc,
        0, // SoTiet - nếu không có giá trị thì để 0 hoặc kiểm tra
        SoTien,
        TruThue,
        Dot,
        NamHoc,
        MaPhongBan,
        MaBoMon,
        KhoaDuyet,
        DaoTaoDuyet,
        TaiChinhDuyet,
      ];
    });

    // Định nghĩa câu lệnh chèn
    const queryInsert = `
      INSERT INTO hopdonggvmoi (
        id_Gvm, DienThoai, Email, MaSoThue, DanhXung, HoTen, NgaySinh, HSL, CCCD, NoiCapCCCD,
        DiaChi, STK, NganHang, NgayBatDau, NgayKetThuc, KiHoc, SoTiet, SoTien, TruThue,
        Dot, NamHoc, MaPhongBan, MaBoMon, KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet
      ) VALUES ?;
    `;

    // Thực hiện câu lệnh chèn
    await connection.promise().query(queryInsert, [insertValues]);

    // Trả về kết quả thành công
    return { success: true, message: "Dữ liệu đã được chèn thành công!" };
  } catch (err) {
    console.error(err); // Ghi lại lỗi để gỡ lỗi
    return {
      success: false,
      message: "Đã xảy ra lỗi trong quá trình cập nhật thông tin.",
    };
  }
};

const insertGiangDay = async () => {
  const query2 = `
    SELECT
      qc.*, 
      gvmoi.*, 
      SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
    FROM quychuan qc
    JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
  `;

  try {
    const [dataJoin] = await connection.promise().query(query2);

    // Chuẩn bị dữ liệu để chèn từng loạt
    const insertValues = await Promise.all(
      dataJoin.map(async (item) => {
        const {
          Khoa,
          MoiGiang,
          SoTinChi,
          LopHocPhan,
          GiaoVien,
          GiaoVienGiangDay,
          LL,
          SoTietCTDT,
          HeSoT7CN,
          SoSinhVien,
          HeSoLopDong,
          QuyChuan,
          KiHoc,
          NamHoc,
          MaHocPhan,
          TenLop,
        } = item;

        const TenHocPhan = LopHocPhan;

        const gv1 = GiaoVienGiangDay ? GiaoVienGiangDay.split(" - ") : [];
        const gv2 = GiaoVien ? GiaoVien.split(" - ") : [];
        let gv = gv1.length > 0 ? gv1[0] : gv2[0];
        let id_Gvm = 1;
        let id_User = 1;

        if (MoiGiang == 1) {
          // Lấy id_Gvm khi giảng viên mới giảng
          id_Gvm = await getGvmId(gv1[0]);
          gv = gv1[0];
        } else {
          // Nếu không có giảng viên thì lấy id_User
          // id_User = !GiaoVienGiangDay
          //   ? await getNhanvienId(gv2[0])
          //   : await getNhanvienId(gv1[0]);
          if (!GiaoVienGiangDay) {
            id_User = await getNhanvienId(gv2[0]);
            gv = gv2[0];
          } else {
            id_User = await getNhanvienId(gv1[0]);
            gv = gv1[0];
          }
        }
        console.log("Mã học phần = ", MaHocPhan);
        // Kiểm tra môn học đã tồn tại chưa
        if (!(await hocPhanDaTonTai(MaHocPhan))) {
          await themHocPhan(MaHocPhan, TenHocPhan, SoTinChi, Khoa);
        }

        // Trả về mảng các giá trị đã chờ để đưa vào câu INSERT
        return [
          gv,
          SoTinChi,
          TenHocPhan,
          id_User,
          id_Gvm,
          LL,
          SoTietCTDT,
          HeSoT7CN,
          SoSinhVien,
          HeSoLopDong,
          QuyChuan,
          KiHoc,
          NamHoc,
          MaHocPhan,
          TenLop,
        ];
      })
    );

    // Kiểm tra xem có dữ liệu để chèn không
    if (insertValues.length === 0) {
      return { success: false, message: "Không có dữ liệu để chèn!" };
    }

    // Định nghĩa câu lệnh chèn
    const queryInsert = `
      INSERT INTO giangday (
        GiangVien, SoTC, TenHocPhan, id_User, id_Gvm, LenLop, SoTietCTDT, HeSoT7CN, SoSV, HeSoLopDong, 
        QuyChuan, HocKy, NamHoc, MaHocPhan, Lop
      ) VALUES ?;
    `;

    // Thực hiện câu lệnh chèn
    await connection.promise().query(queryInsert, [insertValues]);
    // Trả về kết quả thành công
    return { success: true, message: "Dữ liệu đã được chèn thành công!" };
  } catch (err) {
    console.error(err); // Ghi lại lỗi để gỡ lỗi
    return {
      success: false,
      message: "Đã xảy ra lỗi trong quá trình cập nhật thông tin.",
    };
  }
};

const submitData2 = async (req, res) => {
  try {
    const updateResult = await updateAllTeachingInfo(); // Gọi hàm mà không cần res

    if (updateResult.success) {
      const insertResult = await insertGiangDay(); // Gọi hàm insertGiangDay cũng tương tự
      if (insertResult.success) {
        return res.status(200).json({ message: insertResult.message });
      } else {
        return res.status(400).json({ message: insertResult.message });
      }
    } else {
      return res.status(400).json({ message: updateResult.message });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Đã xảy ra lỗi không xác định." });
  }
};

// const submitData2 = async (req, res) => {
//   updateAllTeachingInfo(req, res);
//   insertGiangDay(req, res);
// };

module.exports = {
  handleUploadAndRender,
  importJSONToDB,
  importTableQC,
  importTableTam,
  checkExistKhoa,
  deleteRowByKhoa,
  updateChecked,
  updateAllTeachingInfo,
  submitData2,
  updateQC,
};
