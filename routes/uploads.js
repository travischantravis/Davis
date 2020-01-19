const express = require("express");
const router = express.Router();
const path = require("path");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");

router.get("/", (req, res) => {
  res.render("upload");
});

module.exports = router;
