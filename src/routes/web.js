const express = require("express");
const router = express.Router();
const {
  getHomePage,
  getAbc,
  createUser,
  getLogin,
  getIndex,
} = require("../controllers/homeController");

router.get("/homePage", getHomePage);
router.get("/abc", getAbc);
router.post("/abc/create", createUser);
/////////////////////////////////
router.get("/", getLogin);
router.get("/index", getIndex);

module.exports = router;
