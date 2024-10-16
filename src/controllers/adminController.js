const express = require('express');

const AdminController = {
  index: (req, res) => {
    res.render('admin', { title: 'Trang admin' });
  }
};
showThemTaiKhoan: (req, res) => {
  res.render('themTK', { title: 'Thêm Tài Khoản' });
},

module.exports = {
  AdminController,
  showThemTaiKhoan: AdminController.showThemTaiKhoan
};
