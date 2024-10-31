const XLSX = require("xlsx");
const fs = require("fs");
require("dotenv").config();
const path = require("path");
const connection = require("../controllers/connectDB");
const createPoolConnection = require("../config/databasePool");
const { json, query } = require("express");
const gvms = require("../services/gvmServices");
const nhanviens = require("../services/nhanvienServices");
const { isNull } = require("util");

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

    console.log("import thành công");

    return jsonObjects;
  } catch (err) {
    throw new Error("Cannot read file!: " + err.message);
  }
};

const checkDataQC = async (req, res) => {
  const tableName = process.env.DB_TABLE_QC; // Lấy tên bảng từ biến môi trường
  const { Dot, Ki, Nam } = req.body; // Lấy các giá trị từ body request

  // Câu truy vấn kiểm tra sự tồn tại của giá trị Khoa trong bảng
  const queryCheck = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE Dot = ? AND Ki = ? AND Nam = ?) AS exist;`;

  // Kiểm tra sự tồn tại
  connection.query(queryCheck, [Dot, Ki, Nam], (err, results) => {
    if (err) {
      console.error("Lỗi khi kiểm tra file import:", err);
      return res.status(500).json({ error: "Lỗi kiểm tra cơ sở dữ liệu" });
    }

    // Kết quả trả về từ cơ sở dữ liệu
    const exist = results[0].exist === 1;

    if (exist) {
      return res
        .status(200)
        .json({ message: "Dữ liệu đã tồn tại trong hệ thống." });
    } else {
      return res
        .status(404)
        .json({ message: "Dữ liệu không tồn tại trong hệ thống." });
    }
  });
};

const importTableQC = async (jsonData) => {
  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"

  // console.log(jsonData);
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

  function tachGiaoVien(giaoVienInput) {
    // null
    if (!giaoVienInput) {
      return [{ MoiGiang: false, GiaoVienGiangDay: "" }];
    }
    // trường hợp có không có ( gvm )
    else if (!giaoVienInput.includes("gvm")) {
      const gvmKeyword1 = "( gvm )"; // Từ khóa cho giảng viên mời
      const gvmKeyword2 = "Giảng viên mời"; // Từ khóa cho giảng viên mời

      // Nếu chuỗi đầu vào rỗng, trả về giá trị mặc định
      if (!giaoVienInput || giaoVienInput.trim() === "") {
        return [{ MoiGiang: false, GiaoVienGiangDay: "" }];
      }

      // Kiểm tra xem có giảng viên mời hay không
      const isGuestLecturer =
        giaoVienInput.toLowerCase().includes(gvmKeyword1.toLowerCase()) ||
        giaoVienInput.toLowerCase().includes(gvmKeyword2.toLowerCase());

      // Nếu có giảng viên mời, trả về giá trị mặc định
      if (isGuestLecturer) {
        return [{ MoiGiang: true, GiaoVienGiangDay: "" }];
      }

      // Tách tên giảng viên từ chuỗi
      const titleRegex = /(PGS\.?|( gvm )\.?|TS\.?|PGS\.? TS\.?)\s*/gi; // Biểu thức chính quy để loại bỏ danh hiệu gồm PGS. TS. PGS. TS. ( gvm )

      // Xóa danh hiệu khỏi chuỗi nhưng giữ lại phần còn lại
      const cleanedInput = giaoVienInput.replace(titleRegex, "").trim();

      // Tách tên giảng viên bằng cả dấu phẩy và dấu chấm phẩy
      const lecturers = cleanedInput
        .split(/[,;(]\s*/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      // Nếu không có giảng viên, trả về giá trị mặc định
      if (lecturers.length === 0) {
        return [{ MoiGiang: false, GiaoVienGiangDay: "" }];
      }

      // Tạo mảng kết quả chứa thông tin giảng viên
      return [
        {
          MoiGiang: false, // Không có giảng viên mời
          GiaoVienGiangDay: lecturers[0], // Lấy tên giảng viên đầu tiên
        },
      ];
    } else {
      // Tách tên giảng viên từ chuỗi
      const titleRegex = /(PGS\.?|( gvm )\.?|TS\.?|PGS\.? TS\.?)\s*/gi; // Biểu thức chính quy để loại bỏ danh hiệu gồm PGS. TS. PGS. TS. ( gvm )

      // Xóa danh hiệu khỏi chuỗi nhưng giữ lại phần còn lại
      const cleanedInput = giaoVienInput.replace(titleRegex, "").trim();

      // Tách tên giảng viên bằng cả dấu phẩy và dấu chấm phẩy
      const lecturers = cleanedInput
        .split(/[,;(]\s*/)
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      // Nếu không có giảng viên, trả về giá trị mặc định
      if (lecturers.length === 0) {
        return [{ MoiGiang: false, GiaoVienGiangDay: "" }];
      }

      // Tạo mảng kết quả chứa thông tin giảng viên
      return [
        {
          MoiGiang: true, // Có giảng viên mời
          GiaoVienGiangDay: lecturers[0], // Lấy tên giảng viên đầu tiên
        },
      ];
    }
  }

  const getBoMon = async (lecturers) => {
    // console.log(lecturers);

    // Câu truy vấn SQL
    const query = "SELECT HoTen, MonGiangDayChinh FROM `gvmoi` WHERE HoTen = ?";

    // Tạo mảng các Promise để thực hiện truy vấn với từng tên giảng viên
    const lecturerPromises = lecturers.map(async (lecturerName) => {
      // console.log(lecturerName);
      if (!lecturerName) return null; // Kiểm tra nếu tên giảng viên không hợp lệ

      try {
        const results = await new Promise((resolve, reject) => {
          connection.query(query, [lecturerName], (err, results) => {
            if (err) {
              console.error("Error:", err);
              return reject(err);
            }
            resolve(results);
          });
        });

        // Nếu có kết quả, trả về đối tượng chứa thông tin giảng viên
        return results[0] || null; // trả về thông tin giảng viên hoặc null nếu không có kết quả
      } catch (error) {
        console.error("Error fetching lecturer info:", error);
        return null; // Trả về null nếu có lỗi xảy ra
      }
    });

    try {
      // Đợi tất cả các truy vấn hoàn thành và lọc bỏ kết quả null
      const results = await Promise.all(lecturerPromises);
      return results.filter(Boolean); // Trả về mảng các đối tượng chứa thông tin giảng viên
    } catch (error) {
      console.error("Error during processing lecturer promises:", error);
      return []; // Trả về mảng rỗng nếu có lỗi
    }
  };

  // Hàm này để kết nối hai hàm tachGiaoVien và getBoMon với nhau
  // Hàm để lấy thông tin giảng viên từ cơ sở dữ liệu
  const dataBoMon = async (jsonData) => {
    const allResults = []; // Mảng để chứa tất cả kết quả

    for (const item of jsonData) {
      const giaoVienInput = item.GiaoVien; // Lấy giá trị GiaoVien từ từng đối tượng
      const lecturerInfo = tachGiaoVien(giaoVienInput); // Tách thông tin giảng viên

      // Lấy tên giảng viên từ kết quả
      const lecturers = lecturerInfo.map(info => info.GiaoVienGiangDay).filter(Boolean);

      // Nếu không có giảng viên nào, bỏ qua vòng lặp
      if (lecturers.length === 0) {
        continue;
      }

      // Gọi hàm getBoMon để lấy thông tin chi tiết giảng viên từ cơ sở dữ liệu
      const boMonResults = await getBoMon(lecturers);

      // Ánh xạ kết quả từ cơ sở dữ liệu thành các đối tượng và thêm vào mảng allResults
      boMonResults.forEach(item => {
        allResults.push({
          HoTen: item.HoTen, // Tên giảng viên
          MonGiangDayChinh: item.MonGiangDayChinh, // Môn giảng dạy chính
        });
      });
    }

    return allResults; // Trả về mảng chứa tất cả thông tin giảng viên
  };

  // Hàm thực thi ví dụ cho việc gọi dataBoMon với dữ liệu từ jsonData
  const executeDataBoMonFromJsonData = async (jsonData) => {
    const results = await dataBoMon(jsonData); // Gọi hàm và chờ kết quả
    // console.log("Thông tin giảng viên trả về:", results); // Xuất kết quả ra console
    return results;
  };

  const boMonData = await executeDataBoMonFromJsonData(jsonData);
  // console.log(boMonData);

  // Tạo câu lệnh INSERT động với các trường đầy đủ
  const queryInsert = `INSERT INTO ${tableName} (
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
    GhiChu
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  const insertPromises = jsonData.flatMap((item) => {
    // Sử dụng hàm tachChuoi để tách các thông tin từ chuỗi
    const { TenLop, HocKi, NamHoc, Lop } = tachChuoi(item["LopHocPhan"]);

    // Tách giảng viên và tạo mảng các đối tượng giảng viên
    const giangVienArray = tachGiaoVien(item["GiaoVien"]);
    // const boMondata = executeDataBoMonFromJsonData(jsonData);

    // Giả sử boMon là mảng các đối tượng đã được lấy từ jsonData
    // const boMondata = executeDataBoMonFromJsonData(jsonData);

    return giangVienArray.map(({ MoiGiang, GiaoVienGiangDay }) => {
      return new Promise((resolve, reject) => {
        // Tìm MonGiangDayChinh tương ứng với GiaoVienGiangDay
        const boMonFound = boMonData.find(boMon => boMon.HoTen === GiaoVienGiangDay);
        const monGiangDayChinh = boMonFound ? boMonFound.MonGiangDayChinh : "";

        // Tạo mảng giá trị
        const values = [
          item["Khoa"], // Khoa
          item["Dot"], // Đợt
          item["Ki"], // Đợt
          item["Nam"], // Đợt
          item["GiaoVien"], // Tên Giảng viên
          GiaoVienGiangDay, // Tên giảng viên
          MoiGiang, // Giảng viên mời hay không
          item["SoTinChi"], // Số tín chỉ
          item["MaHocPhan"], // Mã học phần
          TenLop, // Lớp học phần (được tách từ chuỗi)
          Lop,
          monGiangDayChinh, // Thêm MonGiangDayChinh nếu có
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
  });


  let results = false;

  try {
    await Promise.all(insertPromises);

    // Chạy câu lệnh UPDATE sau khi INSERT thành công
    const queryUpdate = `UPDATE ${tableName} SET MaHocPhan = CONCAT(Khoa, id);`;

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

const checkFile = async (req, res) => {
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường
  const { Khoa, Dot, Ki, Nam } = req.body;
  // Câu truy vấn kiểm tra sự tồn tại của giá trị Khoa trong bảng
  const queryCheck = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE Khoa = ? AND Dot = ? AND Ki = ? AND Nam = ?) AS exist;`;

  // Sử dụng Promise để kiểm tra sự tồn tại
  return new Promise((resolve, reject) => {
    connection.query(queryCheck, [Khoa, Dot, Ki, Nam], (err, results) => {
      if (err) {
        console.error("Lỗi khi kiểm tra file import:", err);
        return reject(
          res.status(500).json({ error: "Lỗi kiểm tra cơ sở dữ liệu" })
        );
      }

      // Kết quả trả về từ cơ sở dữ liệu
      const exist = results[0].exist === 1; // True nếu tồn tại, False nếu không tồn tại

      if (exist) {
        return resolve(
          res.status(200).json({
            message: "Dữ liệu đã tồn tại trong cơ sở dữ liệu",
            exists: true,
          })
        );
      } else {
        return resolve(
          res.status(200).json({
            message: "Dữ liệu không tồn tại trong cơ sở dữ liệu",
            exists: false,
          })
        );
      }
    });
  });
};

// Hàm xóa row theo trường 'Khoa'
const deleteFile = (req, res) => {
  const tableName = process.env.DB_TABLE_TAM; // Lấy tên bảng từ biến môi trường

  const { Khoa, Dot, Ki, Nam } = req.body;

  // Query SQL để xóa row
  const sql = `DELETE FROM ${tableName} WHERE Khoa = ? AND Dot = ? AND Ki = ? AND Nam = ?`;

  connection.query(sql, [Khoa, Dot, Ki, Nam], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi truy vấn", error: err });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu" });
    }

    return res.status(200).json({ message: "Xóa thành công" });
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

      if (KhoaDuyet == 1) {
        if (GiaoVienGiangDay.length == 0) {
          return res.status(200).json({
            message: `Lớp học phần ${LopHocPhan} (${TenLop}) chưa được điền giảng viên`,
          });
        }
      }

      // Truy vấn kiểm tra nếu bản ghi đã được duyệt đầy đủ
      const approvalQuery = `SELECT KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet FROM ${tableName} WHERE ID = ?`;
      const approvalResult = await queryAsync(approvalQuery, [ID]);

      // if (approvalResult.length > 0) {
      //   const { KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet } = approvalResult[0];

      //   // Kiểm tra nếu tất cả 3 cột đều được duyệt
      //   if (KhoaDuyet === 0 && DaoTaoDuyet === 0 && TaiChinhDuyet === 0) {
      //     // Lúc đầu là full === 1
      //     // Thêm ID vào danh sách hoàn thiện
      //     completedIDs.push(ID);
      //     //continue; // Bỏ qua bản ghi này và tiếp tục với bản ghi tiếp theo
      //   }
      // }

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
    // if (completedIDs.length == 0) {
    //   //completedIDs.length > 0
    //   return res.status(200).json({
    //     message: "Dữ liệu đã hoàn thiện, không thể cập nhật",
    //   });
    // }

    // Nếu tất cả cập nhật thành công
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật dữ liệu" });
  }
};

// Phòng ban duyệt - teching info2
const phongBanDuyet = async (req, res) => {
  const role = req.session.role;
  const duyet = process.env.DUYET;

  const tableName = process.env.DB_TABLE_QC; // Giả sử biến này có giá trị là "quychuan"
  const jsonData = req.body; // Lấy dữ liệu từ req.body

  // Lấy kết nối từ pool
  const connection = await createPoolConnection();

  try {
    // Duyệt qua từng phần tử trong jsonData
    for (let item of jsonData) {
      const { ID, KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet } = item;

      // Nếu chưa duyệt đầy đủ, tiến hành cập nhật
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          KhoaDuyet = ?,
          DaoTaoDuyet = ?,
          TaiChinhDuyet = ?
        WHERE ID = ?
      `;

      const updateValues = [KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet, ID];

      await connection.query(updateQuery, updateValues);
    }

    // Nếu tất cả cập nhật thành công
    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật dữ liệu" });
  } finally {
    connection.release(); // Trả kết nối về pool sau khi hoàn tất
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

const getDanhXung = (gioiTinh) => {
  return gioiTinh === "Nam" ? "Ông" : gioiTinh === "Nữ" ? "Bà" : "";
};

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

const hocPhanDaTonTai = async (TenHocPhan) => {
  const query = `SELECT TenHocPhan FROM hocphan WHERE LOWER(REPLACE(TRIM(TenHocPhan), '  ', ' ')) = LOWER(REPLACE(TRIM(?), '  ', ' '))`;
  const [rows] = await connection.promise().query(query, [TenHocPhan]);

  return rows.length > 0; // Nếu có ít nhất một kết quả, môn học đã tồn tại
};

const themHocPhan = async (TenHocPhan, DVHT, Khoa) => {
  const query = `
    INSERT INTO hocphan (TenHocPhan, DVHT, Khoa)
    VALUES (?, ?, ?)
  `;
  const values = [TenHocPhan, DVHT, Khoa];

  await connection.promise().query(query, values);
};

const updateAllTeachingInfo = async () => {
  const query2 = `
  SELECT
    qc.*,
    gvmoi.*,
    SUM(qc.QuyChuan) AS TongSoTiet,  
    SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
  FROM quychuan qc
  JOIN gvmoi ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = gvmoi.HoTen
  WHERE qc.DaLuu = 0
  GROUP BY gvmoi.HoTen;  
`;

  try {
    const [dataJoin] = await connection.promise().query(query2);

    // Kiểm tra xem có dữ liệu không
    if (!dataJoin || dataJoin.length === 0) {
      return {
        success: false,
        message: "Không có dữ liệu để chèn.",
      };
    }

    // Chuẩn bị dữ liệu để chèn từng loạt
    //const insertValues = dataJoin.map((item) => {
    const insertValues = await Promise.all(
      dataJoin
        .filter((item) => item.TaiChinhDuyet != 0 && item.DaLuu == 0) // Loại bỏ các mục có TaiChinhDuyet = 0
        .map(async (item) => {
          const {
            ID,
            id_Gvm,
            DienThoai,
            Email,
            MaSoThue,
            HoTen,
            NgaySinh,
            HocVi,
            ChucVu,
            HSL,
            CCCD,
            NoiCapCCCD,
            DiaChi,
            STK,
            NganHang,
            NgayBatDau,
            NgayKetThuc,
            KiHoc,
            TongSoTiet, // Lấy cột tổng số tiết đã tính từ SQL
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
          // const getDanhXung = (GioiTinh) => {
          //   return GioiTinh === "Nam" ? "Ông" : GioiTinh === "Nữ" ? "Bà" : "";
          // };
          let SoTiet = TongSoTiet || 0; // Nếu QuyChuan không có thì để 0
          let SoTien = (TongSoTiet || 0) * 1000000; // Tính toán số tiền
          let TruThue = 0; // Giả định không thu thuế
          let MaBoMon = 0; // Giá trị mặc định là 0

          return [
            id_Gvm,
            DienThoai,
            Email,
            MaSoThue,
            DanhXung,
            HoTen,
            NgaySinh,
            HocVi,
            ChucVu,
            HSL,
            CCCD,
            NoiCapCCCD,
            DiaChi,
            STK,
            NganHang,
            NgayBatDau,
            NgayKetThuc,
            KiHoc,
            SoTiet,
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
        })
    );

    // Kiểm tra xem insertValues có rỗng không
    if (
      insertValues.length === 0 ||
      insertValues.some((row) => row.length === 0)
    ) {
      return {
        success: false,
        message: "Không có dữ liệu hợp lệ để chèn.",
      };
    }

    // Định nghĩa câu lệnh chèn
    const queryInsert = `
      INSERT INTO hopdonggvmoi (
        id_Gvm, DienThoai, Email, MaSoThue, DanhXung, HoTen, NgaySinh, HocVi, ChucVu, HSL, CCCD, NoiCapCCCD,
        DiaChi, STK, NganHang, NgayBatDau, NgayKetThuc, KiHoc, SoTiet, SoTien, TruThue,
        Dot, NamHoc, MaPhongBan, MaBoMon, KhoaDuyet, DaoTaoDuyet, TaiChinhDuyet
      ) VALUES ?;
    `;

    // Thực hiện câu lệnh chèn
    await connection.promise().query(queryInsert, [insertValues]);

    // Trả về kết quả thành công
    return { success: true, message: "Dữ liệu đã được chèn thành công!" };
  } catch (err) {
    console.error("Lỗi:", err.message); // Ghi lại lỗi để gỡ lỗi
    return {
      success: false,
      message: "Đã xảy ra lỗi trong quá trình lưu hợp đồng",
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
      dataJoin
        .filter((item) => item.TaiChinhDuyet != 0 && item.DaLuu == 0) // Bỏ qua các mục có TaiChinhDuyet = 0
        .map(async (item) => {
          const {
            ID,
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
          let gv = gv1[0];
          let id_Gvm = 1;
          let id_User = 1;

          // Lấy id_Gvm khi giảng viên mới giảng
          id_Gvm = await getGvmId(gv1[0]);

          const DaLuu = 1;
          // Thêm Đã lưu = 1 vào quy chuẩn
          const updateQuery = `UPDATE QuyChuan SET DaLuu = ? WHERE ID = ?;`;
          await connection.promise().query(updateQuery, [DaLuu, ID]);

          // Kiểm tra môn học đã tồn tại chưa
          const exists = await hocPhanDaTonTai(TenHocPhan);
          console.log("Học phần đã tồn tại:", exists); // In ra giá trị tồn tại

          if (exists === false) {
            console.log("Ten hoc phan = ", TenHocPhan);
            console.log("So tin", SoTinChi);
            console.log("Khoa = ", Khoa);
            await themHocPhan(TenHocPhan, SoTinChi, Khoa);
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
      message: "Đã xảy ra lỗi trong quá trình thêm dl vào giảng dạy",
    };
  }
};

const insertGiangDay2 = async () => {
  const query2 = `
    SELECT
      qc.*,
      nhanvien.*,
      SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) AS TenGiangVien
    FROM quychuan qc
    JOIN nhanvien ON SUBSTRING_INDEX(qc.GiaoVienGiangDay, ' - ', 1) = nhanvien.TenNhanVien
  `;

  try {
    const [dataJoin] = await connection.promise().query(query2);

    // Chuẩn bị dữ liệu để chèn từng loạt
    const insertValues = await Promise.all(
      dataJoin
        .filter((item) => item.TaiChinhDuyet != 0 && item.DaLuu == 0) // Bỏ qua các mục có TaiChinhDuyet = 0
        .map(async (item) => {
          //dataJoin.map(async (item) => {
          const {
            ID,
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
          let gv = gv1[0];
          let id_Gvm = 1;
          let id_User = 1;

          id_User = await getNhanvienId(gv1[0]);

          const DaLuu = 1;
          // Thêm Đã lưu = 1 vào quy chuẩn
          const updateQuery = `UPDATE QuyChuan SET DaLuu = ? WHERE ID = ?;`;
          await connection.promise().query(updateQuery, [DaLuu, ID]);

          const exists = await hocPhanDaTonTai(TenHocPhan);
          console.log("Học phần đã tồn tại:", exists); // In ra giá trị tồn tại

          if (exists === false) {
            await themHocPhan(TenHocPhan, SoTinChi, Khoa);
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
    const updateResult = await updateAllTeachingInfo(); // Hàm thêm vào hợp đồng giảng viên mời

    const update2 = await insertGiangDay2(); // Hàm thêm vào giảng dạy (nhân viên)

    if (updateResult.success) {
      const insertResult = await insertGiangDay(); // Hàm thêm vào giảng dạy (giảng viên mời)
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
  checkFile,
  deleteFile,
  updateChecked,
  updateAllTeachingInfo,
  submitData2,
  updateQC,
  checkDataQC,
  phongBanDuyet,
};
