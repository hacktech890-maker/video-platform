require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const cloudinary = require("./cloudinaryConfig");
const abyssService = require("./abyssService");
const Video = require("./models/Video");

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MONGODB CONNECTION ====================

async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is missing in environment variables");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// ==================== ADMIN SECURITY ====================

function requireAdmin(req, res, next) {
  const adminPass = req.headers["x-admin-password"];

  if (!adminPass || adminPass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized! Admin password required.",
    });
  }

  next();
}

// ==================== CORS CONFIG ====================

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (origin.endsWith(".netlify.app")) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== MULTER UPLOAD CONFIG ====================

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video") {
      const allowedTypes = /mp4|avi|mkv|mov|wmv|flv|webm|mpeg|mpg|m4v/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = file.mimetype.startsWith("video/");

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error("Only video files are allowed for video field!"));
      }
    } else if (file.fieldname === "thumbnail") {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );

      const mimetype =
        file.mimetype.startsWith("image/") ||
        file.mimetype === "application/octet-stream";

      if (mimetype && (extname || file.mimetype.startsWith("image/"))) {
        return cb(null, true);
      } else {
        return cb(new Error("Only image files are allowed for thumbnail!"));
      }
    } else {
      return cb(null, true);
    }
  },
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
  console.log("Created uploads directory (ephemeral - Render free tier)");
}

// ==================== ROUTES ====================

// Health check
app.get("/api/health", async (req, res) => {
  const quotaInfo = await abyssService.getQuotaInfo();

  res.json({
    status: "ok",
    message: "Video platform API is running (Abyss.to)",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    abyssQuota: quotaInfo
      ? {
          storageUsage: quotaInfo.storageQuota?.usage || 0,
          storageLimit: quotaInfo.storageQuota?.limit || 0,
          dailyUploadRemaining: quotaInfo.uploadQuota?.dailyUploadRemaining || 0,
        }
      : null,
  });
});

// ==================== ADMIN ROUTES ====================

// Verify admin password
app.post("/api/admin/verify", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    message: "Admin verified successfully ✅",
  });
});

// Admin stats
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  (async () => {
    try {
      const totalVideos = await Video.countDocuments();

      const viewsAgg = await Video.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
          },
        },
      ]);

      const totalViews = viewsAgg?.[0]?.totalViews || 0;

      return res.json({
        success: true,
        stats: {
          totalVideos,
          totalViews,
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load admin stats",
        error: error.message,
      });
    }
  })();
});

// ==================== VIDEO ROUTES ====================

// GET all videos (newest first)
app.get("/api/videos", (req, res) => {
  (async () => {
    try {
      const videos = await Video.find().sort({ upload_date: -1, createdAt: -1 });

      res.json({
        success: true,
        count: videos.length,
        videos: videos,
      });
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch videos",
        error: error.message,
      });
    }
  })();
});

// GET video by MongoDB _id and increment views
app.get("/api/videos/:id", (req, res) => {
  (async () => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      video.views = (video.views || 0) + 1;
      await video.save();

      res.json({
        success: true,
        video: video,
      });
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch video",
        error: error.message,
      });
    }
  })();
});

// Upload video to Abyss + thumbnail to Cloudinary (ADMIN ONLY)
app.post(
  "/api/videos/upload",
  requireAdmin,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.video) {
        return res.status(400).json({
          success: false,
          message: "No video file uploaded",
        });
      }

      const { title, duration } = req.body;
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

      if (!title) {
        fs.unlinkSync(videoFile.path);
        if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);

        return res.status(400).json({
          success: false,
          message: "Video title is required",
        });
      }

      console.log("Uploading video to Abyss.to:", videoFile.originalname);

      const uploadResult = await abyssService.uploadVideo(
        videoFile.path,
        videoFile.originalname
      );

      console.log("Upload successful:", uploadResult);

      let thumbnailUrl = abyssService.getThumbnailUrl(uploadResult.file_id);

      if (thumbnailFile) {
        console.log("Uploading thumbnail to Cloudinary...");

        const uploadThumb = await cloudinary.uploader.upload(
          thumbnailFile.path,
          {
            folder: "video-thumbnails",
            resource_type: "image",
          }
        );

        console.log("Thumbnail uploaded:", uploadThumb.secure_url);

        thumbnailUrl = uploadThumb.secure_url;
      }

      let embedUrl =
        uploadResult.embed_url ||
        uploadResult.url ||
        uploadResult.link ||
        uploadResult.short_url ||
        null;

      let embedCode = null;

      if (embedUrl && embedUrl.includes("short.icu/")) {
        embedCode = embedUrl.split("short.icu/")[1].trim();
      }

      if (!embedCode) {
        embedCode = uploadResult.file_id;
      }

      const video = await Video.create({
        file_code: uploadResult.file_id,
        embed_code: embedCode,
        title: title,
        thumbnail: thumbnailUrl,
        duration: duration || "0:00",
        status: uploadResult.status || "processing",
        upload_date: new Date(),
        views: 0,
      });

      fs.unlinkSync(videoFile.path);

      if (thumbnailFile && fs.existsSync(thumbnailFile.path)) {
        fs.unlinkSync(thumbnailFile.path);
      }

      res.json({
        success: true,
        message: "Video uploaded successfully to Abyss.to",
        video: video,
      });
    } catch (error) {
      console.error("Error uploading video:", error);

      if (req.files) {
        if (req.files.video && fs.existsSync(req.files.video[0].path)) {
          fs.unlinkSync(req.files.video[0].path);
        }
        if (req.files.thumbnail && fs.existsSync(req.files.thumbnail[0].path)) {
          fs.unlinkSync(req.files.thumbnail[0].path);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to upload video to Abyss.to",
        error: error.message,
      });
    }
  }
);

// Add existing file_code (ADMIN ONLY)
app.post("/api/videos/add", requireAdmin, async (req, res) => {
  try {
    const { file_code, title, duration } = req.body;

    if (!file_code || !title) {
      return res.status(400).json({
        success: false,
        message: "file_code and title are required",
      });
    }

    const existingVideo = await Video.findOne({ file_code: file_code.trim() });
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: "Video with this file_code already exists",
      });
    }

    try {
      const fileInfo = await abyssService.getFileInfo(file_code);
      console.log("File verified on Abyss.to:", fileInfo);
    } catch (error) {
      console.warn("Could not verify file on Abyss.to:", error.message);
    }

    const video = await Video.create({
      file_code: file_code.trim(),
      embed_code: file_code.trim(),
      title: title.trim(),
      thumbnail: abyssService.getThumbnailUrl(file_code.trim()),
      duration: duration || "0:00",
      upload_date: new Date(),
      views: 0,
      status: "active",
    });

    res.json({
      success: true,
      message: "Video added successfully",
      video: video,
    });
  } catch (error) {
    console.error("Error adding video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add video",
      error: error.message,
    });
  }
});

// Delete video (ADMIN ONLY)
app.delete("/api/videos/:id", requireAdmin, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    await Video.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: error.message,
    });
  }
});

// Embed url endpoint
app.get("/api/videos/:id/embed", (req, res) => {
  (async () => {
    try {
      const video = await Video.findById(req.params.id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      const embedUrl = `https://short.icu/${video.embed_code || video.file_code}`;

      res.json({
        success: true,
        embed_url: embedUrl,
      });
    } catch (error) {
      console.error("Error getting embed URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get embed URL",
        error: error.message,
      });
    }
  })();
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "production" ? "An error occurred" : err.message,
  });
});

// ==================== START SERVER ====================

connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Video hosting: Abyss.to`);
    console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);

    if (!process.env.ABYSS_API_KEY) {
      console.error("⚠️ WARNING: ABYSS_API_KEY not set! Video uploads will fail.");
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.error("⚠️ WARNING: CLOUDINARY ENV VARIABLES NOT SET!");
    }

    if (!process.env.ADMIN_PASSWORD) {
      console.error("⚠️ WARNING: ADMIN_PASSWORD not set! Upload will always fail.");
    }

    if (!process.env.MONGODB_URI) {
      console.error("⚠️ WARNING: MONGODB_URI not set! Database will fail.");
    }
  });
});

module.exports = app;
