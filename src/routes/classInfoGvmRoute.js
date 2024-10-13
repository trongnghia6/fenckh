// Xem thông tin các lớp giảng viên mời
const express = require("express");
const router = express.Router();

const {
  getClassInfoGvm,
  getGvm,
  getSampleClassInfoGvm,
  // Khoa công nghệ thông tin
  // getClassInfoGvmCNTT,
  // getGvmCNTT,
} = require("../controllers/classInfoGvmController");

router.get("/classInfoGvm", getClassInfoGvm);

// Lấy danh sách giảng viên mời đưa ra script
router.get("/api/classInfoGvm", getGvm);
router.get("/sampleClassInfoGvm", getSampleClassInfoGvm);
// Khoa công nghệ thông tin
// router.get("/classInfoGvmCNTT", getClassInfoGvmCNTT);
// router.get("/api/gvmCNTT", getGvmCNTT);

module.exports = router;
