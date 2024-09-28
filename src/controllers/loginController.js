const connection = require("../connectDb");
require("dotenv").config();

// Xử lý đăng nhập
const login = (req, res) => {
  const { username, password } = req.body;

  // Truy vấn cơ sở dữ liệu
  connection.query(
    "SELECT * FROM taikhoannguoidung WHERE TenDangNhap = ?",
    [username],
    (err, results) => {
      // Kiểm tra lỗi trong truy vấn

      // Kiểm tra nếu có kết quả trả về
      if (results && results.length > 0) {
        const user = results[0];
        // connection.query('SELECT Quyen FROM role WHERE TenDangNhap = ?', [username], (err, Quyen) => {
        //     if (Quyen == 'daotao')

        // });
        // So sánh mật khẩu
        if (user.MatKhau == password) {
          // Sử dụng 'MatKhau' để so sánh
          req.session.userId = user.id_User; // Lưu id_User vào session

          // Phân quyền
          let url;
          connection.query(
            "SELECT Quyen FROM role WHERE TenDangNhap = ?",
            [username],
            (err, results) => {
              const value = results[0].Quyen;
              if (value.includes("daotao")) {
                url = "/daotao";
              } else {
                url = "/index";
              }
              console.log(value);
              console.log(url);
            }
          );

          // Trả về phản hồi thành công cho login.ejs
          // return res.status(200).json({ message: 'Đăng nhập thành công' }); // Trả về thông báo thành công
          return res.status(200).json({
            message: "Đăng nhập thành công",
            url,
          });
        } else {
          return res.status(401).json({ message: "Mật khẩu không chính xác" }); // Thông báo lỗi nếu mật khẩu sai
        }
      } else {
        return res
          .status(404)
          .json({ message: "Tên tài khoản không chính xác" }); // Thông báo lỗi nếu không tìm thấy người dùng
      }
    }
  );
};

module.exports = login;
