const express = require("express");
const path = require("path");
require("dotenv").config();
const session = require("express-session");
const login = require("./routes/loginRoute");
//const importFile = require("./routes/importRoute");
//console.log("> check env: ", process.env);

// Connect to database
const connection = require("./config/database");

// config engine template
const configViewEngine = require("./config/viewEngine");

// const webRoutes = require("./routes/web");

// Cấu hình đường dẫn routes
const webRoutes = require("./routes/web");
const createGvmRoutes = require("./routes/createGvmRoute");
const gvmList = require("./routes/gvmListRoute");
const updateGvm = require("./routes/updateGvmRoute");
const classInfoGvm = require("./routes/classInfoGvmRoute");

const app = express();
const port = process.env.port || 8888;
const hostname = process.env.HOST_NAME;

// config engine template
configViewEngine(app);

// cấu hình session cho login
app.use(express.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }, // set secure: true nếu bạn sử dụng HTTPS
//   })
// );

// Thiết lập session trong Express
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    // Đặt true nếu bạn sử dụng HTTPS
    cookie: { maxAge: 6000000 }, // Session sẽ hết hạn sau 100 phút không hoạt động

    // cookie: { secure: true, maxAge: 6000000 }, // Session sẽ hết hạn sau 100 phút không hoạt động
  })
);

// config res.body
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true })); // for form data

// Khai bao route
app.use("/", webRoutes);
app.use("/", login);
app.use("/", createGvmRoutes);
app.use("/", gvmList);
app.use("/", updateGvm);
app.use("/", classInfoGvm);

app.listen(port, hostname, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Phục vụ các file tĩnh từ thư mục node_modules
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

// == src of L ==
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public/js"))); // cấu hình tệp js
// app.use(express.static(path.join(__dirname, "public"))); // cấu hình tệp js

app.use(express.json()); // Thêm dòng này để xử lý JSON

const importFile = require("./routes/importRoute");
const infoGvm = require("./routes/infoRoute");
const tableQc = require("./routes/gvmRoute");
//const { require } = require("app-root-path");

app.use("/", importFile); // cấu hình import
app.use("/", infoGvm); // cấu hình import
app.use("/", tableQc); // cấu hình import
