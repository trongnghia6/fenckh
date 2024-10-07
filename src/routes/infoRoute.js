const express = require('express');
const router = express.Router();
const obj = require('../controllers/infoGvmController'); // Import hàm xử lý file từ controller
const obj2 = require('../controllers/getTableDBController'); // Import hàm xử lý file từ controller


// render site info
router.get('/index/info', (req, res) => {
  res.render('teachingInfo');
});

router.get('/info2', (req, res) => {
  res.render('teachingInfo2');
});

// gọi hàm lấy dữ liệu giảng viên từ import
router.get('/index/teaching-info', (req, res) => obj.renderInfo(req, res));

// gọi hàm lấy dữ liệu tên giảng giảng viên mời
router.get('/index/name-gvm', (req, res) => obj.getNameGVM(req, res));

router.get('/index/name-gvm-khoa', (req, res) => obj.getKhoaAndNameGvmOfKhoa(req, res));

module.exports = router;
