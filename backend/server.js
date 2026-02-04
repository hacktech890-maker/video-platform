require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const abyssService = require('./abyssService'); // CHANGED: From streamtapeService
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== CORS CONFIG ====================

// PRODUCTION CORS - Allow multiple origins
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow exact allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow ALL Netlify preview deploy URLs
    // Example: https://randomhash--yourapp.netlify.app
    if (origin.endsWith(".netlify.app")) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== MULTER UPLOAD CONFIG ====================

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB limit (Abyss.to maxUploadSize)
  },
  fileFilter: (req, file, cb) => {

    // VIDEO FILE CHECK
    if (file.fieldname === 'video') {
      const allowedTypes = /mp4|avi|mkv|mov|wmv|flv|webm|mpeg|mpg|m4v/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.startsWith('video/');

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        return cb(new Error('Only video files are allowed for video field!'));
      }
    }

    // THUMBNAIL FILE CHECK
    else if (file.fieldname === 'thumbnail') {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

      // Some browsers send thumbnail as octet-stream
      const mimetype =
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/octet-stream';

      if (mimetype && (extname || file.mimetype.startsWith("image/"))) {
        return cb(null, true);
      } else {
        return cb(new Error('Only image files are allowed for thumbnail!'));
      }
    }

    // OTHER FIELDS
    else {
      return cb(null, true);
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log('Created uploads directory (ephemeral - Render free tier)');
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', async (req, res) => {
  const quotaInfo = await abyssService.getQuotaInfo();

  res.json({
    status: 'ok',
    message: 'Video platform API is running (Abyss.to)',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    abyssQuota: quotaInfo ? {
      storageUsage: quotaInfo.storageQuota?.usage || 0,
      storageLimit: quotaInfo.storageQuota?.limit || 0,
      dailyUploadRemaining: quotaInfo.uploadQuota?.dailyUploadRemaining || 0
    } : null
  });
});

// GET /api/videos - Get all videos
app.get('/api/videos', (req, res) => {
  try {
    const videos = db.getAllVideos();
    res.json({
      success: true,
      count: videos.length,
      videos: videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos',
      error: error.message
    });
  }
});

// GET /api/videos/:id - Get single video by ID
app.get('/api/videos/:id', (req, res) => {
  try {
    const video = db.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment views
    db.incrementViews(req.params.id);

    res.json({
      success: true,
      video: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video',
      error: error.message
    });
  }
});

// POST /api/videos/upload - Upload video to Abyss.to
app.post('/api/videos/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
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
        message: 'Video title is required'
      });
    }

    console.log('Uploading video to Abyss.to:', videoFile.originalname);

    // Upload video to Abyss.to
    const uploadResult = await abyssService.uploadVideo(
      videoFile.path,
      videoFile.originalname
    );

    console.log('Upload successful:', uploadResult);

    // Prepare thumbnail URL
    let thumbnailUrl = abyssService.getThumbnailUrl(uploadResult.file_id);

    // Custom thumbnail handling
    if (thumbnailFile) {
      console.log('Custom thumbnail provided:', thumbnailFile.originalname);
      console.warn('Custom thumbnails not persisted (ephemeral storage). Consider using CDN.');
      // TODO: Upload to CDN (Cloudinary, S3, etc.)
    }

    // Save to database
    const video = db.addVideo({
      file_code: uploadResult.file_id, // Using file_code for compatibility
      title: title,
      thumbnail: thumbnailUrl,
      duration: duration || '0:00',
      status: uploadResult.status || 'processing'
    });

    // Clean up local files
    fs.unlinkSync(videoFile.path);
    if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);

    res.json({
      success: true,
      message: 'Video uploaded successfully to Abyss.to',
      video: video
    });
  } catch (error) {
    console.error('Error uploading video:', error);

    // Clean up files if they exist
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
      message: 'Failed to upload video to Abyss.to',
      error: error.message
    });
  }
});

// POST /api/videos/add - Add existing Abyss.to video by file ID
app.post('/api/videos/add', async (req, res) => {
  try {
    const { file_code, title, duration } = req.body;

    if (!file_code || !title) {
      return res.status(400).json({
        success: false,
        message: 'file_code and title are required'
      });
    }

    // Check if video already exists
    const existingVideo = db.getVideoByFileCode(file_code);
    if (existingVideo) {
      return res.status(400).json({
        success: false,
        message: 'Video with this file_code already exists'
      });
    }

    // Verify file exists on Abyss.to
    try {
      const fileInfo = await abyssService.getFileInfo(file_code);
      console.log('File verified on Abyss.to:', fileInfo);
    } catch (error) {
      console.warn('Could not verify file on Abyss.to:', error.message);
      // Continue anyway - file might exist but API call failed
    }

    // Save to database
    const video = db.addVideo({
      file_code: file_code,
      title: title,
      thumbnail: abyssService.getThumbnailUrl(file_code),
      duration: duration || '0:00'
    });

    res.json({
      success: true,
      message: 'Video added successfully',
      video: video
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add video',
      error: error.message
    });
  }
});

// DELETE /api/videos/:id - Delete video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const video = db.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete from database
    db.deleteVideo(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
});

// GET /api/videos/:id/embed - Get embed URL
app.get('/api/videos/:id/embed', (req, res) => {
  try {
    const video = db.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      embed_url: abyssService.getEmbedUrl(video.file_code)
    });
  } catch (error) {
    console.error('Error getting embed URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get embed URL',
      error: error.message
    });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Video hosting: Abyss.to`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);

  // Check Abyss.to API key
  if (!process.env.ABYSS_API_KEY) {
    console.error('⚠️  WARNING: ABYSS_API_KEY not set! Video uploads will fail.');
  }

  // Seed database with sample data (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Seeding database with sample data...');
    db.seedData();
    console.log(`Sample videos added: ${db.getAllVideos().length}`);
  } else {
    console.log('Production mode - no sample data seeded');
    console.log('Note: Using ephemeral in-memory storage (data resets on restart)');
  }
});

module.exports = app;
