const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const crypto = require("crypto");
const mongoose = require("mongoose");

// const Upload = require("./models/Upload");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Mongo URI
const mongoURI =
  "mongodb+srv://davis:davisdavis@davis-m9cfq.gcp.mongodb.net/test?retryWrites=true&w=majority";

// Create mongo connection and get rid of warnings
const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
      res.render("upload1", { files: false });
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
      res.render("upload1", { files: files });
    }
  });
});

// @route POST /upload/image
// @desc uploads file to DB
app.post("/upload/image", upload.single("file"), (req, res) => {
  // res.json({ file: req.file });
  res.redirect("/post");
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
const Schema = mongoose.Schema;
const Model = mongoose.Model;

const UploadSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  item: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    type: String,
    required: false
  },
  contact: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

class UploadClass extends Model {}

const Upload = conn.model(UploadClass, UploadSchema);

// @route GET /upload
app.get("/upload", (req, res) => {
  res.render("upload");
});

// @route POST /upload
app.post("/upload/form", (req, res) => {
  const upload = new Upload({
    name: req.body.name,
    item: req.body.item,
    location: req.body.location,
    description: req.body.description,
    contact: req.body.contact,
    reward: req.body.reward,
    date: req.body.date
  });

  upload
    .save()
    .then(item => {
      res.redirect("/upload1");
    })
    .catch(err => {
      res.status(400).send("unable to save to database");
    });

  // try {
  //   const savedUpload = await upload.save();
  //   res.redirect("/upload");
  // } catch (err) {
  //   res.json({ message: err });
  // }
});

app.get("/post", async (req, res) => {
  // res.render("post");
  try {
    const uploads = await Upload.find();
    gfs.files.find().toArray((err, files) => {
      // Check if files exist
      if (!files || files.length === 0) {
        res.render("post", { files: false });
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
        res.render("post", { uploads: uploads, files: files });
      }
    });
    // res.render("post", { uploads: uploads });
  } catch (err) {
    res.json({ message: err });
  }
});

async function visionFunction(imgPath) {
  // Imports the Google Cloud client library
  const vision = require("@google-cloud/vision");

  // Creates a client
  const client = new vision.ImageAnnotatorClient({
    keyFilename: "./APIKey.json"
  });

  // Performs label detection on the image file
  const [result] = await client.labelDetection(imgPath);
  const labels = result.labelAnnotations;
  console.log("Labels:");
  // labels.forEach(label => console.log(label.description));

  console.log(labels[0].description);
  // return labels[0].description;
}

// // Your web app's Firebase configuration
// var firebaseConfig = {
//   apiKey: "AIzaSyD5jmluU_hrvxxgd7_VHKZ4bif0O4UjghY",
//   authDomain: "davis-265523.firebaseapp.com",
//   databaseURL: "https://davis-265523.firebaseio.com",
//   projectId: "davis-265523",
//   storageBucket: "davis-265523.appspot.com",
//   messagingSenderId: "292521290205",
//   appId: "1:292521290205:web:1af25d78434f4c96506e34",
//   measurementId: "G-1T08H92V8T"
// };
// // Initialize Firebase
// // firebase.initializeApp(firebaseConfig);
// // firebase.analytics();

// // Create a root reference
// var storageRef = firebase.storage().ref();
// // File or Blob named mountains.jpg
// var file = "./public/img/hydro-flask.jpg";

// // Create the file metadata
// var metadata = {
//   contentType: "image/jpeg"
// };

// // Upload file and metadata to the object 'images/mountains.jpg'
// var uploadTask = storageRef.child("images/" + file.name).put(file, metadata);

// // Listen for state changes, errors, and completion of the upload.
// uploadTask.on(
//   firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
//   function(snapshot) {
//     // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
//     var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//     console.log("Upload is " + progress + "% done");
//     switch (snapshot.state) {
//       case firebase.storage.TaskState.PAUSED: // or 'paused'
//         console.log("Upload is paused");
//         break;
//       case firebase.storage.TaskState.RUNNING: // or 'running'
//         console.log("Upload is running");
//         break;
//     }
//   },
//   function(error) {
//     // A full list of error codes is available at
//     // https://firebase.google.com/docs/storage/web/handle-errors
//     switch (error.code) {
//       case "storage/unauthorized":
//         // User doesn't have permission to access the object
//         break;

//       case "storage/canceled":
//         // User canceled the upload
//         break;

//       case "storage/unknown":
//         // Unknown error occurred, inspect error.serverResponse
//         break;
//     }
//   },
//   function() {
//     // Upload completed successfully, now we can get the download URL
//     uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
//       console.log("File available at", downloadURL);
//     });
//   }
// );

// Get a reference to the storage service, which is used to create references in your storage bucket
// var storage = firebase.storage();

const port = 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
