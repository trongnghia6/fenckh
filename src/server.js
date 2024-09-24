const express = require("express");
const path = require("path");
require("dotenv").config();

//console.log("> check env: ", process.env);

// Connect to database
const connection = require("./config/database");

// config engine template
const configViewEngine = require("./config/viewEngine");

// const webRoutes = require("./routes/web");
const webRoutes = require("./routes/web");

const app = express();
const port = process.env.port || 8888;
const hostname = process.env.HOST_NAME;

// config engine template
configViewEngine(app);

// config res.body
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true })); // for form data

// Khai bao route
app.use("/", webRoutes);

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});

// Phục vụ các file tĩnh từ thư mục node_modules
// app.use("/node_modules", express.static(path.join(__dirname, "/node_modules")));
app.use(express.static(path.join(__dirname, "../node_modules")));
app.use(express.static(path.join(__dirname, "public/images")));

// simple query
// connection.query("SELECT * FROM `bomon`", function (err, results, fields) {
//   // console.log("result = ", results); // results contains rows returned by server
//   // console.log(fields); // fields contains extra meta data about results, if available
//   // Chuyển đổi kết quả thành JSON
//   // const jsonData = JSON.stringify(results);

//   // // In ra dữ liệu dưới dạng JSON
//   // console.log("Data in JSON format: ", jsonData);
// });
