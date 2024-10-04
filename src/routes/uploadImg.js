const express = require("express");

// import multer from "multer";
const multer = require("multer");
const path = require("path");
// import path from "path";
var appRoot = require("app-root-path");
const router = express.Router();

const {
  //createGVM,
  handleUploadFile,
} = require("../controllers/createGvmController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, appRoot + "/src/public/images/userIdCardPhotos/frontPhotos");
    if (file.fieldname == "truocCCCD") {
      cb(null, appRoot + "/src/public/images/userIdCardPhotos/frontPhotos/");
    } else if (file.fieldname == "sauCCCD") {
      cb(null, appRoot + "/src/public/images/userIdCardPhotos/backPhotos/");
    }
  },
  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    let idUser = req.body.Id_GVM ? req.body.Id_GVM : "unknown-user";
    cb(
      null,
      idUser +
        // file.fieldname +
        // "-" +
        // Date.now() +
        path.extname(file.originalname)
    );
  },
});
const imageFilter = function (req, file, cb) {
  console.log("filename: ", file.fieldname);
  if (file == undefined) return;
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|jfif)$/)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }

  cb(null, true);
};

let upload = multer({ storage: storage, fileFilter: imageFilter });

//router.post("/daotaoxemhd/daotaonhap/createGVM", createGVM);
// router.post(
//   "/daotaoxemhd/daotaonhap/cccd",
//   upload.single("truocCCCD"),
//   upload.single("sauCCCD"),
//   handleUploadFile
// );
router.post(
  "/daotaoxemhd/daotaonhap/cccd",
  upload.fields([
    { name: "truocCCCD", maxCount: 1 },
    { name: "sauCCCD", maxCount: 1 },
  ]),
  handleUploadFile
);

module.exports = router;
