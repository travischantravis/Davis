const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");

const app = express();

// Middleware
app.set("view engine", "ejs");

// Public folder
app.use(express.static(path.join(__dirname, "public")));

// @route GET /
// @desc Loads form
app.get("/", (req, res) => {
  res.render("index");
});

//Routes
app.use("/upload", require("./routes/uploads"));
app.use("/post", require("./routes/posts"));

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
