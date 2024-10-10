const express = require("express");
const router = express.Router();
const obj = require("../controllers/teachingInfoController"); // Import hàm xử lý file từ controller
const obj2 = require("../controllers/getTableDBController"); // Import hàm xử lý file từ controller

// render site info
router.get("/info", obj.getTeachingInfo1);
router.get("/info2", obj.getTeachingInfo2);
// router.get('/info', (req, res) => {
//   res.render('teachingInfo');
// });

// router.get('/info2', (req, res) => {
//   res.render('teachingInfo2');
// });

// Đổi từ GET sang POST
router.post("/index/teaching-info", (req, res) => obj.renderInfo(req, res));

// gọi hàm lấy dữ liệu tên giảng giảng viên mời
router.get("/index/name-gvm", (req, res) => obj.getNameGV(req, res));

router.get("/index/name-gvm-khoa", (req, res) =>
  obj.getKhoaAndNameGvmOfKhoa(req, res)
);

module.exports = router;
