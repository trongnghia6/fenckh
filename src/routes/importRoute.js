const express = require('express');
const multer = require('multer');
const obj = require('../controllers/importController'); // Import hàm xử lý file từ controller
const obj2 = require('../controllers/getTableDBController'); // Import hàm xử lý file từ controller

// const test = require('../controllers/fileController');


const router = express.Router();

// Cấu hình multer để lưu file tạm thời trong thư mục 'uploads'
const upload = multer({
  dest: 'uploads/' // Đường dẫn thư mục lưu trữ file
});

// Route GET để render trang upload file
router.get('/import', (req, res) => {
  res.render('import'); // render file 'import.ejs' trong thư mục 'views'
});

// Route POST để xử lý upload file Excel
router.post('/import', upload.single('excelFile'), obj.handleUploadAndRender);


// Định tuyến cho POST request tới /index / save - data
router.post('/save-data', async (req, res) => {
  try {
    // Gọi hàm xử lý dữ liệu import
    const result = await obj.importTableTam(req.body);

    // Kiểm tra kết quả trả về và phản hồi cho client
    if (result === true) {
      res.status(200).json({ success: true, message: 'Dữ liệu đã được lưu thành công!' });
    } else {
      res.status(500).json({ success: false, message: 'Lưu dữ liệu thất bại!' });
    }
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ success: false, message: 'Lỗi trong quá trình lưu dữ liệu!', error });
  }
});

// Định tuyến cho POST request tới /index / save - data
router.post('/ban-hanh', async (req, res) => {
  try {
    // Gọi hàm xử lý dữ liệu import
    const result = await obj.importTableQC(req.body);

    // Kiểm tra kết quả trả về và phản hồi cho client
    if (result === true) {
      res.status(200).json({ success: true, message: 'Dữ liệu đã được lưu thành công!' });
    } else {
      res.status(500).json({ success: false, message: 'Lưu dữ liệu thất bại!' });
    }
  } catch (error) {
    console.error('Lỗi server:', error);
    res.status(500).json({ success: false, message: 'Lỗi trong quá trình lưu dữ liệu!', error });
  }
});

router.get('/get-table-tam', async (req, res) => {
  try {
    const data = await obj2.getTableTam(); // Lấy dữ liệu từ cơ sở dữ liệu
    res.json(data); // Trả về dữ liệu dưới dạng JSON
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu' });
  }
});

router.post('/check-khoa', obj.checkExistKhoa);


module.exports = router;
