const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/admin', (req, res) => {
    res.render('admin'); // Hiển thị trang thông tin hợp đồng giảng viên mời
});

router.get('/thongTinTK', (req, res) => {
    res.render('thongTinTK');
});


router.get('/themTK', (req, res) => {
    res.render('themTK');
});

module.exports = router;