//const connection = require("../connectDb");
const connection = require("../config/database");
require("dotenv").config();

const login = async (req, res) => {
  const { username, password } = req.body;

  const roleDaoTaoALL = process.env.DAOTAO_ALL;
  const roleTaiChinhALL = process.env.TAICHINH_ALL;

  const roleCNTTAll = process.env.CNTT_ALL;
  const roleATTTAll = process.env.ATTT_ALL;
  const roleDTVTAll = process.env.DTVT_ALL;

  // const roleDaoTaoThiHanh = process.env.THIHANH;
  const roleCNTTThiHanh = process.env.CNTT_THIHANH;
  const roleATTTThiHanh = process.env.ATTT_THIHANH;
  const roleDTVTThiHanh = process.env.DTVT_THIHANH;


  const roleDaoTaoXem = process.env.DAOTAO_XEM;
  const roleTaiChinhXem = process.env.TAICHINH_XEM;
  const roleCNTTXem = process.env.CNTT_XEM;
  const roleATTTXem = process.env.ATTT_XEM;
  const roleDTVTXem = process.env.DTVT_XEM;

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
        // console.log();
        // console.log("đến đây r");


        const role = roles[0].Quyen;
        console.log('role đăng nhập : ' + role);
        if (role.includes(roleDaoTaoALL)) {
          req.session.role = roleDaoTaoALL; // Lưu vai trò vào session
          url = "/maindt";
        } else if (role.includes(roleDaoTaoXem)) {
          req.session.role = roleDaoTaoXem; // Lưu vai trò vào session
          url = "/maindt";
          // } else if (role.includes(roleDaoTaoThiHanh)) {
          //   req.session.role = roleDaoTaoThiHanh; // Lưu vai trò vào session
          //   url = "/maindt";
        } else if (role.includes(roleCNTTAll)) {
          req.session.role = roleCNTTAll; // Lưu vai trò vào session
          url = "/mainkhoa";
        } else if (role.includes(roleCNTTXem)) {
          req.session.role = roleCNTTXem; // Lưu vai trò vào session
          url = "/mainkhoa";
        } else if (role.includes(roleCNTTThiHanh)) {
          req.session.role = roleCNTTThiHanh; // Lưu vai trò vào session
          url = "/mainkhoa";
        } else if (role.includes(roleATTTAll)) {
          req.session.role = roleATTTAll;
          url = "/mainkhoa";
        } else if (role.includes(roleATTTXem)) {
          req.session.role = roleATTTXem;
          url = "/mainkhoa";
        } else if (role.includes(roleATTTThiHanh)) {
          req.session.role = roleATTTThiHanh;
          url = "/mainkhoa";
        } else if (role.includes(roleDTVTAll)) {
          req.session.role = roleDTVTAll;
          url = "/mainkhoa";
        } else if (role.includes(roleDTVTXem)) {
          req.session.role = roleDTVTXem;
          url = "/mainkhoa";
        } else if (role.includes(roleDTVTThiHanh)) {
          req.session.role = roleDTVTThiHanh;
          url = "/mainkhoa";
        } else if (role.includes(roleTaiChinhALL)) {
          req.session.role = roleTaiChinhALL;
          url = "/maindt";
        } else if (role.includes(roleTaiChinhXem)) {
          req.session.role = roleTaiChinhXem;
          url = "/maindt";
        }



        // Trả về phản hồi thành công với url
        return res.status(200).json({ url, role });
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
