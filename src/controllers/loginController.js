const connection = require('../config/database'); // Import connection từ file cấu hình cơ sở dữ liệu

const login = async (req, res) => {
  const { username, password } = req.body;

  // Lấy tên người dùng
  const query = `SELECT TenNhanVien FROM nhanvien 
                 JOIN taikhoannguoidung ON nhanvien.id_User = taikhoannguoidung.id_User
                 WHERE TenDangNhap = ?`;
  const [TenNhanViens] = await connection.promise().query(query, [username]);
  const TenNhanVien = TenNhanViens[0].TenNhanVien;

  try {
    // Truy vấn người dùng từ cơ sở dữ liệu
    const [users] = await connection
      .promise()
      .query("SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?", [
        username,
      ]); // select cả password

    // Kiểm tra nếu có người dùng
    if (users.length > 0) {
      const user = users[0];

      // So sánh mật khẩu
      if (user.MatKhau === password) {
        req.session.userId = user.id_User; // Lưu id_User vào session

        // Phân quyền người dùng
        const [roles] = await connection.promise().query(
          "SELECT MaPhongBan, Quyen, isKhoa FROM role WHERE TenDangNhap = ?",
          [username]
        );

        // Kiểm tra nếu không có vai trò
        if (!roles || roles.length === 0) {
          req.session.role = "admin"; // Gán vai trò admin nếu không có vai trò
          req.session.MaPhongBan = null;
          console.log("role = admin");
        } else {
          const MaPhongBan = roles[0].MaPhongBan;
          const role = roles[0].Quyen;
          const isKhoa = roles[0].isKhoa;
          req.session.role = role;
          req.session.MaPhongBan = MaPhongBan;
          console.log("role = ", role);
          console.log("MaPhongBan = ", MaPhongBan);
        }

        let url;

        if (req.session.role === "admin") {
          url = "/admin"; // Đăng nhập vào trang admin
        } else if (req.session.MaPhongBan === 1) {
          url = "/mainkhoa";
        } else {
          url = "/maindt";
        }

        // Trả về phản hồi thành công với url
        return res
          .status(200)
          .json({ url, role: req.session.role, MaPhongBan: req.session.MaPhongBan, isKhoa: req.session.isKhoa, TenNhanVien });
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
  }
};

module.exports = login;