const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    file_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    embed_code: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: "0:00",
      trim: true,
    },
    upload_date: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "processing",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ file_code: 1 }, { unique: true });

module.exports = mongoose.model("Video", videoSchema);
