//const connection = require("../connectDb");
const connection = require("../config/database");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

  // Lấy tên người dùng
  query = `select TenNhanVien from nhanvien 
            join taikhoannguoidung on nhanvien.id_User = taikhoannguoidung.id_User
            where TenDangNhap = ?`;
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
      if (user.MatKhau == password) {
        req.session.userId = user.id_User; // Lưu id_User vào session

        // Phân quyền người dùng
        const [roles] = await connection
          .promise()
          .query(
            "SELECT MaPhongBan, Quyen, isKhoa FROM role WHERE TenDangNhap = ?",
            [username]
          );

        let url;

        const MaPhongBan = roles[0].MaPhongBan;
        const role = roles[0].Quyen;
        const isKhoa = roles[0].isKhoa;
        req.session.role = role;
        req.session.MaPhongBan = MaPhongBan;
        req.session.isKhoa = isKhoa;
        console.log("role = ", role);
        console.log("MaPhongBan = ", MaPhongBan);
        //console.log('role đăng nhập : ' + role);
        if (isKhoa == 0) {
          url = "/maindt";
        } else {
          url = "/mainkhoa";
        }

        // Trả về phản hồi thành công với url
        return res
          .status(200)
          .json({ url, role, MaPhongBan, isKhoa, TenNhanVien });
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
