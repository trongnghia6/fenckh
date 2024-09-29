const express = require('express');
const multer = require('multer');
const obj = require('../controllers/importController'); // Import hàm xử lý file từ controller
// const test = require('../controllers/fileController');


const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
const upload = multer({
  dest: 'uploads/' // Đường dẫn thư mục lưu trữ file
});

// Route GET để render trang upload file
router.get('/index/import', (req, res) => {
  res.render('import'); // render file 'import.ejs' trong thư mục 'views'
});

// Route POST để xử lý upload file Excel
router.post('/index/import', upload.single('excelFile'), obj.handleUploadAndRender);

module.exports = router;
