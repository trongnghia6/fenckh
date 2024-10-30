// //const connection = require("../config/database");
// const createPoolConnection = require("../config/databasePool");
// require("dotenv").config();

// const login = async (req, res) => {
//   const { username, password } = req.body;
//   let connection;

//   try {
//     connection = createPoolConnection();
//     // Truy vấn người dùng từ cơ sở dữ liệu
//     const [users] = await connection.query(
//       "SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?",
//       [username]
//     ); // select cả password

//     // Kiểm tra nếu có người dùng
//     if (users.length > 0) {
//       const user = users[0];

//       // So sánh mật khẩu
//       if (user.MatKhau == password) {
//         req.session.userId = user.id_User; // Lưu id_User vào session

//         // Lấy tên người dùng
//         query = `select TenNhanVien from nhanvien
//             join taikhoannguoidung on nhanvien.id_User = taikhoannguoidung.id_User
//             where TenDangNhap = ?`;
//         const [TenNhanViens] = await connection.query(query, [username]);
//         const TenNhanVien = TenNhanViens[0].TenNhanVien;

//         // Phân quyền người dùng
//         const [roles] = await connection.query(
//           "SELECT MaPhongBan, Quyen,isKhoa FROM role WHERE TenDangNhap = ?",
//           [username]
//         );

//         const MaPhongBan = roles[0].MaPhongBan;
//         const role = roles[0].Quyen;
//         const isKhoa = roles[0].isKhoa;
//         req.session.role = role;
//         req.session.MaPhongBan = MaPhongBan;
//         req.session.isKhoa = isKhoa;

//         let url;

//         if (role == "ADMIN" || role == "") {
//           req.session.role = "ADMIN"; // Gán vai trò admin nếu không có vai trò
//           req.session.MaPhongBan = null;
//           url = "/admin"; // Đăng nhập vào trang admin
//         } else if (isKhoa == 1) {
//           url = "/mainkhoa";
//         } else {
//           url = "/maindt";
//         }

//         // Trả về phản hồi thành công với url
//         return res
//           .status(200)
//           .json({ url, role, MaPhongBan, isKhoa, TenNhanVien, username });
//       } else {
//         return res.status(401).json({ message: "Mật khẩu không chính xác" });
//       }
//     } else {
//       return res.status(404).json({ message: "Tên tài khoản không chính xác" });
//     }
//   } catch (err) {
//     // Xử lý lỗi
//     console.error(err);
//     return res.status(500).json({ message: "Lỗi máy chủ" });
//   } finally {
//     if (connection) connection.release(); // Giải phóng kết nối
//   }
// };

// module.exports = login;
const createPoolConnection = require("../config/databasePool");
require("dotenv").config();
const createTrigger = async (connection, userId, tenNhanVien) => {
  // Tạo câu lệnh SQL để tạo trigger
  const dropTriggerQuery = `DROP TRIGGER IF EXISTS log_changes;`
  const triggerQuery = `
  CREATE TRIGGER log_changes
  AFTER UPDATE ON quychuan
  FOR EACH ROW
 BEGIN
  DECLARE change_message VARCHAR(255) DEFAULT '';

  -- Kiểm tra cột GiaoVienGiangDay
  IF OLD.GiaoVienGiangDay != NEW.GiaoVienGiangDay THEN
      SET change_message = CONCAT(change_message, 'Giảng Viên giảng dạy cho môn "', NEW.LopHocPhan, '": từ "', OLD.GiaoVienGiangDay, '" thành "', NEW.GiaoVienGiangDay, '". ');
  END IF;

  -- Kiểm tra cột KhoaDuyet
  IF OLD.KhoaDuyet != NEW.KhoaDuyet THEN
      IF OLD.KhoaDuyet = 0 AND NEW.KhoaDuyet = 1 THEN
          SET change_message = CONCAT(change_message, 'Môn "', NEW.LopHocPhan, '": Đã duyệt. ');
      ELSEIF OLD.KhoaDuyet = 1 AND NEW.KhoaDuyet = 0 THEN
          SET change_message = CONCAT(change_message, 'Môn "', NEW.LopHocPhan, '": Hủy duyệt. ');
      END IF;
  END IF;

  -- Kiểm tra cột GiaoVien
  IF OLD.GiaoVien != NEW.GiaoVien THEN
      SET change_message = CONCAT(change_message, 'Giảng viên cho môn "', NEW.LopHocPhan, '": từ "', OLD.GiaoVien, '" thành "', NEW.GiaoVien, '". ');
  END IF;
  -- Nếu có thay đổi, ghi lại thông tin vào bảng lichsunhaplieu
  IF change_message != '' THEN
      INSERT INTO lichsunhaplieu (id_User, TenNhanVien, LoaiThongTin, NoiDungThayDoi, ThoiGianThayDoi)
      VALUES (
         ${userId},  
        '${tenNhanVien}',
          'Thay đổi nhiều cột',  -- Loại thông tin
          change_message,  -- Nội dung mới với thông báo thay đổi
          NOW()  -- Thời gian thay đổi
      );
  END IF;
END
  `;
  try{
    // Tạo trigger sau khi đăng nhập thành công
    await connection.query(dropTriggerQuery);
    await connection.query(triggerQuery);
    } catch (error) {
        console.error("Lỗi khi tạo trigger:", error.message);
    }

            // Thực thi câu lệnh tạo trigger
};

  
const login = async (req, res) => {
  const { username, password } = req.body;
  let connection;
 
  try {
    connection = await createPoolConnection(); // Đảm bảo dùng await
    
    // Truy vấn người dùng từ cơ sở dữ liệu
    const [users] = await connection.query(
      "SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?",
      [username]
    );
 

        
      
    // Kiểm tra nếu có người dùng
    if (users.length > 0) {
      const user = users[0];
      
      // So sánh mật khẩu
      if (user.MatKhau == password) {
        req.session.userId = user.id_User; // Lưu id_User vào session
        
        // Lấy tên người dùng
        const query = `SELECT TenNhanVien FROM nhanvien 
            JOIN taikhoannguoidung ON nhanvien.id_User = taikhoannguoidung.id_User
            WHERE TenDangNhap = ?`;
        const [TenNhanViens] = await connection.query(query, [username]);
        const TenNhanVien = TenNhanViens[0]?.TenNhanVien;
        await createTrigger(connection, req.session.userId, TenNhanVien);
       
      
        // Phân quyền người dùng
        const [roles] = await connection.query(
          "SELECT MaPhongBan, Quyen, isKhoa FROM role WHERE TenDangNhap = ?",
          [username]
        );

        const MaPhongBan = roles[0]?.MaPhongBan; // Kiểm tra an toàn
        const role = roles[0]?.Quyen; // Kiểm tra an toàn
        const isKhoa = roles[0]?.isKhoa; // Kiểm tra an toàn
        req.session.role = role;
        req.session.MaPhongBan = MaPhongBan;
        req.session.isKhoa = isKhoa;

        let url;

        if (role === "ADMIN" || role === "") {
          req.session.role = "ADMIN"; // Gán vai trò admin nếu không có vai trò
          req.session.MaPhongBan = null;
          url = "/admin"; // Đăng nhập vào trang admin
        } else if (isKhoa === 1) {
          url = "/mainkhoa";
        } else {
          url = "/maindt";
        }
        //

        // Trả về phản hồi thành công với url
        return res
          .status(200)
          .json({ url, role, MaPhongBan, isKhoa, TenNhanVien, username });
      } else {
        return res.status(401).json({ message: "Mật khẩu không chính xác" });
      }
    } else {
      return res.status(404).json({ message: "Tên tài khoản không chính xác" });
    }
  } catch (err) {
    // Xử lý lỗi
    console.error(err);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  } finally {
    if (connection) connection.release(); // Giải phóng kết nối
  }
};

module.exports = login;
