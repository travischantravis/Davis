const express = require("express");
const path = require("path");

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

app.get("/find", (req, res) => {
  res.render("find");
});

app.get("/post", (req, res) => {
  res.render("post");
});

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
