const express = require("express");
const router = express.Router();

const {
  getGvmList,
  getGvm,
  getGvmListCNTT,
  getGvmCNTT,
} = require("../controllers/gvmListController");

// Đào tạo
router.get("/gvmList", getGvmList);
router.get("/api/gvm", getGvm);

// Khoa công nghệ thông tin
// router.get("/khoaCNTT", getGvmListCNTT);
// router.get("/api/gvmKhoaCNTT", getGvmCNTT);

module.exports = router;
