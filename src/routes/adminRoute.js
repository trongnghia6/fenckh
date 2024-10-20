const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const GetTable = require('../controllers/admin');
const { postUpdateGvm, postUpdateNV, postDeleteNV, postUpdatePhongBan, postUpdateTK } = require('../controllers/adminUpdate');

router.get('/admin', (req, res) => {
    res.render('admin');
});

router.get('/thongTinTK', GetTable.getaccountList);


router.get('/nhanVien', GetTable.getnhanvienList);
router.get('/phongBan', GetTable.getdepartmentList)
router.get('/themNhanVien', GetTable.getMaPhongBanList);


// thao tác thêm
router.get('/themPhongBan', AdminController.showThemPhongBan);
router.post('/themPhongBan', AdminController.themPhongBan);
// router.post('/themTK', );
router.get('/themNhanVien', AdminController.showThemNhanVien);
router.post('/themNhanVien', AdminController.themNhanVien);


// hiển thị danh sách
router.get('/nhanVien', AdminController.getNhanVien);
router.get('/api/nhanvien', AdminController.getListNhanVien);

router.get('/phongBan', AdminController.getPhongBan);
router.get('/api/phongban', AdminController.getListPhongBan);

//Nhân viên
router.get('/updateNV/:id',AdminController.getUpdateNV );
router.post('/updateNV/:id',postUpdateNV);
router.post('/deleteNV/:id',postDeleteNV);
//Phòng ban
router.get('/updatePhongBan/:MaPhongBan', GetTable.getUpdatePhongBan);
router.post('/updatePhongBan/:MaPhongBan', postUpdatePhongBan);
//Tài khoản
router.get('/updateTK/:TenDangNhap', AdminController.getUpdateTK);
router.post('/updateTK/:TenDangNhap', postUpdateTK);
router.get('/themTK', AdminController.getthemTaiKhoan);
router.post('/themTK', AdminController.postthemTK);
router.get("/getId_User", AdminController.getId_User);


module.exports = router;