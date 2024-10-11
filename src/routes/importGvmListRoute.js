const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const upload = require("../middlewares/uploadXlsxMiddleware");

const readXlsxFile = require("read-excel-file");

const {
  getImportGvmList,
  convertExcelToJSON,
} = require("../controllers/importGvmListController");

router.get("/importGvmList", getImportGvmList);

// Route để tải lên file
router.post("/postImportGvmList", upload.single("file"), convertExcelToJSON);

module.exports = router;
