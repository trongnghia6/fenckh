const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/admin', (req, res) => {
    res.render('admin');
});

router.get('/thongTinTK', (req, res) => {
    res.render('thongTinTK');
});

router.get('/themTK', (req, res) => {
    res.render('themTK');
});
router.get('/nhanVien', (req, res) => {
    res.render('nhanVien');
});
router.get('/phongBan', (req, res) => {
    res.render('phongBan');
})
router.get('/themNhanVien', (req, res) => {
    res.render('themNhanVien');
});
router.get('/themPhongBan', (req, res) => {
    res.render('themPhongBan');
});

// thao tác thêm
router.get('/themPhongBan', AdminController.showThemPhongBan);
router.post('/themPhongBan', AdminController.themPhongBan);
router.get('/themTK', AdminController.showThemTaiKhoan);
router.get('/themNhanVien', AdminController.showThemNhanVien);
router.post('/themNhanVien', AdminController.themNhanVien)


// hiển thị danh sách
router.get('/nhanVien', AdminController.getNhanVien);
router.get('/api/nhanvien', AdminController.getListNhanVien);

router.get('/phongBan', AdminController.getPhongBan);
router.get('/api/phongban', AdminController.getListPhongBan);


module.exports = router;