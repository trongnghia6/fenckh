const express = require("express");
const router = express.Router();
const {
  getHomePage,
  getAbc,
  createUser,
  getLogin,
  getIndex,
  getImport,
  getDtaoduyet,
  getDtaoxemhd,
  getDtaonhap,
} = require("../controllers/homeController");

router.get("/homePage", getHomePage);
router.get("/abc", getAbc);
router.post("/abc/create", createUser);
/////////////////////////////////
router.get("/", getLogin);
router.get("/index", getIndex);
router.get("/daotaoxemhd", getDtaoxemhd);
router.get("/daotaoxemhd/daotaoduyet", getDtaoduyet);
router.get("/daotaoxemhd/daotaonhap", getDtaonhap);
// router.get("/index/import", getImport);

module.exports = router;
