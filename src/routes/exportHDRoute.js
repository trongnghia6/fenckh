const express = require('express');
const router = express.Router();
const exportHDController = require('../controllers/exportHDController');

// Route để hiển thị trang exportHD
router.get('/exportHD', (req, res) => {
    res.render('exportHD');
});

// Route để xuất hợp đồng giảng viên
router.get('/exportHD/download', exportHDController);

module.exports = router;
