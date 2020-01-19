const mongoose = require("mongoose");

const UploadSchema = mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Upload", UploadSchema);
