const express = require("express");
const router = express.Router();

const {
  gethomePage,
  getLogin,
  getIndex,
  getImport,
  getDtaoduyet,
  getDtaoxemhd,
  getDtaonhap,
  getPhongTaiChinh,
  getHomeMainDaoTao,
  getTeachingInfo,
  getXemBangQC,
  // Khoa
  getMainKhoa,

  // Lấy role
  getRole,
} = require("../controllers/homeController");

// const { createGVM } = require("../controllers/DaoTaoController");

// const {
//   createGVM,
//   handleUploadFile,
// } = require("../controllers/createGvmController");

router.get("/homePage", gethomePage);
// router.get("/abc", getAbc);
// router.post("/abc/create", createUser);
/////////////////////////////////
router.get("/", getLogin);
router.get("/index", getIndex);
//router.get("/dtxemhd", getDtaoxemhd);
//router.get("/maindt", getHomeMainDaoTao);
router.get("/daotaoduyet", getDtaoduyet);
router.get("/daotaoxemhd/daotaonhap", getDtaonhap);

//router.post("/daotaoxemhd/daotaonhap/createGVM", handleUploadFile);
// router.get("/index/import", getImport);
router.get("/index/import", getImport);
router.get("/PhongTaiChinh", getPhongTaiChinh);
//phong dao tao
router.get("/maindt", getHomeMainDaoTao);
router.get("/teachingInfo", getTeachingInfo);
router.get("/maindt/tableQC", getXemBangQC);

// Khoa
router.get("/mainkhoa", getMainKhoa);

// Lấy role
router.get("/api/getRole", getRole);

module.exports = router;
