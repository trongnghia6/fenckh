//const { require } = require("app-root-path");
const express = require("express");
//const connection = require("../config/database");
const createConnection = require("../config/databaseAsync");

const router = express.Router();

const getClassInfoGvm = async (req, res) => {
  res.render("xemCacLopGvm.ejs");
};

module.exports = { getClassInfoGvm };
