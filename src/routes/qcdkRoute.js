const express = require("express");
const router = express.Router();
const obj = require("../controllers/deleteTableDBController"); // Import hàm xử lý từ controller

// Định nghĩa route POST cho xóa dữ liệu
router.post("/xoa-qcdk", obj.deleteTableTam); // Chỉ cần truyền hàm, không gọi nó

module.exports = router;
