const express = require('express');
const router = express.Router();
const obj = require('../controllers/infoGvmController'); // Import hàm xử lý file từ controller

router.get('/index/info', (req, res) => {
  res.render('infoGvm'); // render file 'infoGvm.ejs' trong thư mục 'views'
});

// Sửa lại để thực thi hàm renderInfo
router.get('/index/export', (req, res) => obj.renderInfo(req, res));

module.exports = router;
