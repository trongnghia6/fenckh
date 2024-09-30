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
} = require("../controllers/homeController");

// const { createGVM } = require("../controllers/DaoTaoController");

const { createGVM } = require("../controllers/createGvmController");

router.get("/homePage", gethomePage);
router.get("/abc", getAbc);
router.post("/abc/create", createUser);
/////////////////////////////////
router.get("/", getLogin);
router.get("/index", getIndex);
router.get("/daotaoxemhd", getDtaoxemhd);
router.get("/daotaoxemhd/daotaoduyet", getDtaoduyet);
router.get("/daotaoxemhd/daotaonhap", getDtaonhap);

router.post("/daotaoxemhd/daotaonhap/createGVM", createGVM);
// router.get("/index/import", getImport);
router.get("/index/import", getImport);
router.get("/PhongTaiChinh", getPhongTaiChinh);

module.exports = router;
