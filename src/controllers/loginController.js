//const connection = require("../connectDb");
const connection = require("../config/database");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

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
          .query("SELECT Quyen FROM role WHERE TenDangNhap = ?", [username]);

        let url;
        const role = roles[0].Quyen;

        if (role.includes("daotao_thihanh") || role.includes("daotao")) {
          req.session.role = "daotao_thihanh"; // Lưu vai trò vào session
          url = "/maindt";
        } else if (role.includes("daotao_xem")) {
          req.session.role = "daotao_xem"; // Lưu vai trò vào session
          url = "/maindt";
        } else if (role.includes("CNTT")) {
          req.session.role = "CNTT"; // Lưu vai trò vào session
          console.log("req.session.role = ", req.session.role);
          url = "/mainkhoa";
        } else if (role.includes("ATTT")) {
          req.session.role = "ATTT";
          url = "/gvmList";
        } else if (role.includes("CNTT")) {
          req.session.role = "CNTT";
          url = "/mainkhoa";
        }

        // Trả về phản hồi thành công với url
        return res.status(200).json({ url });
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
