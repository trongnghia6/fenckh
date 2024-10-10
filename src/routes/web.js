const express = require("express");
const router = express.Router();

const {
  gethomePage,
  getAbc,
  createUser,
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
  getMainKhoa,
} = require("../controllers/homeController");

// const { createGVM } = require("../controllers/DaoTaoController");

const {
  createGVM,
  handleUploadFile,
} = require("../controllers/createGvmController");

router.get("/", getLogin);
router.get("/index", getIndex);
// router.get("/dtxemhd", getDtaoxemhd);
router.get("/maindt", getHomeMainDaoTao);
router.get("/daotaoxemhd/daotaoduyet", getDtaoduyet);
router.get("/daotaoxemhd/daotaonhap", getDtaonhap);

//router.post("/daotaoxemhd/daotaonhap/createGVM", handleUploadFile);
// router.get("/index/import", getImport);
router.get("/index/import", getImport);
router.get("/PhongTaiChinh", getPhongTaiChinh);
//phong dao tao
router.get("/maindt", getHomeMainDaoTao);
router.get("/maindt/teachingInfo", getTeachingInfo);
router.get("/maindt/tableQC", getXemBangQC);

// src of L
router.get("/khoaCNTT", getMainKhoa);


module.exports = router;
