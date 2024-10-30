const express = require("express");
const router = express.Router();
const obj = require("../controllers/xemCacLopMoiController");

router.post("/xemCacLopMoi", (req, res) => obj.renderInfo(req, res));

module.exports = router;
