const express = require("express");
const router = express.Router();

const { getGvmList, getGvm } = require("../controllers/gvmListController");

router.get("/daotaoxemhd/gvmList", getGvmList);
router.get("/api/gvm", getGvm);

module.exports = router;
