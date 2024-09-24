const connection = require("../config/database");

const getAbc = (req, res) => {
  res.send("What do you want");
};
const connect = require("../config/database");

// const getAbc = (req, res) => {
//   connect.query("SELECT * FROM `bomon`", function (err, results, fields) {
//     console.log("result = ", results); // results contains rows returned by server
//     // console.log(fields); // fields contains extra meta data about results, if available
//     // Chuyển đổi kết quả thành JSON
//     a = results;
//     res.send(JSON.stringify(a));
//   });
// };

const getHomePage = (req, res) => {
  return res.render("homePage.ejs");
};

const createUser = (req, res) => {
  let maPhongBan = req.body.fname;
  let maBoMon = req.body.lname;
  let tenBoMon = req.body.email;
  let all = [maPhongBan, maBoMon, tenBoMon];
  console.log(all);
  connection.query(
    ` INSERT INTO bomon (MaPhongBan, MaBoMon, TenBoMon)
    VALUES (?, ?, ?) `,
    [maPhongBan, maBoMon, tenBoMon],
    function (err, results) {
      console.log(results);
      res.send("Insert succeed");
    }
  );
};

const getLogin = (req, res) => {
  res.render("login.ejs");
};

const getIndex = (req, res) => {
  res.render("index.ejs");
};

module.exports = { getHomePage, getAbc, createUser, getLogin, getIndex };
