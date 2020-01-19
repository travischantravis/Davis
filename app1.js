const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Upload = require("./models/Upload");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Mongo URI
const mongoURI =
  "mongodb+srv://davis:davisdavis@davis-m9cfq.gcp.mongodb.net/test?retryWrites=true&w=majority";

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once("open", () => {
  console.log("Connected to DB");
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useUnifiedTopology: true, useNewUrlParser: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads"
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// Public folder
app.use(express.static(path.join(__dirname, "public")));

// @route GET /
// @desc Loads index page
app.get("/", (req, res) => {
  res.render("index");
});

// @route GET /upload1
// @desc Loads form
app.get("/upload1", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files exist
    if (!files || files.length === 0) {
      res.render("upload", { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === "image/jpeg" ||
          file.contentType === "image/png" ||
          file.contentType === "image/jpg"
        ) {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render("upload", { files: files });
    }
  });
});

// @route POST /upload/upload
// @desc uploads file to DB
app.post("/upload/upload", upload.single("file"), (req, res) => {
  // res.json({ file: req.file });
  res.redirect("/upload");
});

// @route GET /files
// @desc Display all files in JSON
app.get("/files", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files exist
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "No files exist"
      });
    }
    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc Display single file object
app.get("/files/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if files
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exist"
      });
    }

    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display image
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if files
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }
    // Check if image
    if (
      file.contentType === "image/jpeg" ||
      file.contentType === "image/png" ||
      file.contentType === "image/jpg"
    ) {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

// @route GET /upload
app.get("/upload", (req, res) => {
  res.render("upload");
});

// @route POST /upload
app.post("/upload/form", async (req, res) => {
  const upload = new Upload({
    name: req.body.name,
    item: req.body.item,
    location: req.body.location,
    description: req.body.description
  });
  try {
    const savedUpload = await upload.save();
    res.redirect("/upload1");
  } catch (err) {
    res.json({ message: err });
  }
});

// Routes
// app.use("/upload", require("./routes/uploads"));
app.use("/post", require("./routes/posts"));

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
