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
  getPhongTaiChinh,


} = require("../controllers/homeController");

router.get("/homePage", gethomePage);
router.get("/abc", getAbc);
router.post("/abc/create", createUser);
/////////////////////////////////
router.get("/", getLogin);
router.get("/index", getIndex);
router.get("/daotaoxemhd", getDtaoxemhd);
router.get("/daotaoxemhd/daotaoduyet", getDtaoduyet);
router.get("/index/import", getImport);
router.get("/PhongTaiChinh", getPhongTaiChinh);

module.exports = router;
