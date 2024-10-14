const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

router.get('/', AdminController.index);
router.get('/dashboard', AdminController.dashboard);

module.exports = router;