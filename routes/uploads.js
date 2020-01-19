const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("upload");
});

module.exports = router;
