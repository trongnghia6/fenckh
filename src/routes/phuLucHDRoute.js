const express = require("express");
const router = express.Router();
const phuLucHDController = require('../controllers/phuLucHDController');

// Route để render trang phuLucHD.ejs
router.get('/phuLucHD', (req, res) => {
    res.render('phuLucHD');
});

router.get('/api/export-phu-luc-giang-vien-moi', phuLucHDController.exportPhuLucGiangVienMoi);




module.exports= router;
