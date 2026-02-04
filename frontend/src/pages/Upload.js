import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import videoService from '../services/videoService';
import '../styles/Upload.css';

const Upload = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [fileCode, setFileCode] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'code'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ADMIN PASSWORD STATE ✅
  const [adminPassword, setAdminPassword] = useState('');

  // Metadata state
  const [duration, setDuration] = useState('');
  const [durationDetected, setDurationDetected] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailSource, setThumbnailSource] = useState(null); // 'auto', 'manual', or 'default'
  const [processingMetadata, setProcessingMetadata] = useState(false);

  // Format duration in seconds to mm:ss or hh:mm:ss
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate thumbnail from video file
  const generateThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
          reject(new Error('Video or canvas element not available'));
          return;
        }

        const objectUrl = URL.createObjectURL(videoFile);
        video.src = objectUrl;

        video.onloadedmetadata = () => {
          const videoDuration = video.duration;
          if (videoDuration && !isNaN(videoDuration)) {
            const formattedDuration = formatDuration(videoDuration);
            setDuration(formattedDuration);
            setDurationDetected(true);
          }
        };

        video.onseeked = () => {
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
              if (blob) {
                const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                const previewUrl = URL.createObjectURL(blob);

                setThumbnail(thumbnailFile);
                setThumbnailPreview(previewUrl);
                setThumbnailSource('auto');

                URL.revokeObjectURL(objectUrl);
                resolve(thumbnailFile);
              } else {
                reject(new Error('Failed to create thumbnail blob'));
              }
            }, 'image/jpeg', 0.9);
          } catch (err) {
            console.error('Error drawing to canvas:', err);
            reject(err);
          }
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load video'));
        };

        video.onloadeddata = () => {
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        };
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        reject(err);
      }
    });
  };

  // Handle video file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);

      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }

      setThumbnail(null);
      setThumbnailPreview(null);
      setThumbnailSource(null);
      setDuration('');
      setDurationDetected(false);
      setError(null);

      setProcessingMetadata(true);

      try {
        await generateThumbnail(selectedFile);
      } catch (err) {
        console.warn('Auto thumbnail generation failed:', err.message);
        setThumbnailSource('default');
      } finally {
        setProcessingMetadata(false);
      }
    }
  };

  // Handle manual thumbnail upload
  const handleThumbnailChange = (e) => {
    const thumbnailFile = e.target.files[0];

    if (thumbnailFile) {
      if (!thumbnailFile.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        setError('Thumbnail must be JPG, PNG, or WebP');
        return;
      }

      const previewUrl = URL.createObjectURL(thumbnailFile);
      setThumbnail(thumbnailFile);
      setThumbnailPreview(previewUrl);
      setThumbnailSource('manual');
      setError(null);
    }
  };

  // Handle duration input change
  const handleDurationChange = (e) => {
    const value = e.target.value;
    setDuration(value);
    setDurationDetected(false);
  };

  // Validate duration format
  const validateDuration = (dur) => {
    if (!dur) return true;
    const pattern = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/;
    return pattern.test(dur);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // ✅ ADMIN PASSWORD REQUIRED
    if (!adminPassword.trim()) {
      setError("Admin password is required!");
      return;
    }

    // Validation
    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (uploadMode === 'file' && !file) {
      setError('Please select a video file');
      return;
    }

    if (uploadMode === 'code' && !fileCode.trim()) {
      setError('Please enter an Abyss file code');
      return;
    }

    if (duration && !validateDuration(duration)) {
      setError('Duration must be in format mm:ss or hh:mm:ss');
      return;
    }

    try {
      setUploading(true);

      if (uploadMode === 'file') {
        await videoService.uploadVideo(file, title, duration || "0:00", thumbnail, adminPassword);
      } else {
        await videoService.addVideoByCode(fileCode, title, duration || "0:00", adminPassword);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  return (
    <div className="upload-container">
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="upload-card">
        <h1>Upload Video</h1>

        {/* ✅ ADMIN PASSWORD INPUT */}
        <div className="form-group">
          <label>Admin Password *</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Enter admin password"
            disabled={uploading}
            required
          />
          <p className="help-text">
            Only admin can upload videos. Password is required.
          </p>
        </div>

        <div className="upload-mode-toggle">
          <button
            className={`mode-button ${uploadMode === 'file' ? 'active' : ''}`}
            onClick={() => setUploadMode('file')}
            disabled={uploading}
            type="button"
          >
            Upload File
          </button>

          <button
            className={`mode-button ${uploadMode === 'code' ? 'active' : ''}`}
            onClick={() => setUploadMode('code')}
            disabled={uploading}
            type="button"
          >
            Add by Code
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="title">Video Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              disabled={uploading}
              required
            />
          </div>

          {uploadMode === 'file' ? (
            <>
              <div className="form-group">
                <label htmlFor="video">Select Video File *</label>

                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="video"
                    onChange={handleFileChange}
                    accept="video/*"
                    disabled={uploading}
                    required
                  />

                  {file && (
                    <div className="file-info">
                      <p>Selected: {file.name}</p>
                      <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>

                <p className="help-text">
                  Supported formats: MP4, AVI, MKV, MOV, WMV, FLV, WebM
                </p>
              </div>

              {processingMetadata && (
                <div className="metadata-processing">
                  <span className="spinner-small"></span>
                  <span>Detecting metadata...</span>
                </div>
              )}

              {file && !processingMetadata && (
                <div className="form-group">
                  <label>Thumbnail</label>

                  {thumbnailPreview && (
                    <div className="thumbnail-preview">
                      <img src={thumbnailPreview} alt="Video thumbnail" />
                      <div className="thumbnail-badge">
                        {thumbnailSource === 'auto' && '✅ Auto-generated'}
                        {thumbnailSource === 'manual' && '✏️ Manually uploaded'}
                      </div>
                    </div>
                  )}

                  {(!thumbnail || thumbnailSource === 'default') && (
                    <div className="thumbnail-fallback">
                      <div className="thumbnail-placeholder">
                        <p>No thumbnail generated</p>
                      </div>
                    </div>
                  )}

                  <div className="file-input-wrapper">
                    <label htmlFor="thumbnail" className="thumbnail-upload-label">
                      📷 {thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail Manually'}
                    </label>

                    <input
                      type="file"
                      id="thumbnail"
                      onChange={handleThumbnailChange}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      disabled={uploading}
                      className="thumbnail-input"
                    />
                  </div>

                  <p className="help-text">
                    Optional: Upload JPG, PNG, or WebP (recommended 16:9 ratio)
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="duration">
                  Duration {durationDetected && '(auto-detected)'}
                </label>

                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={handleDurationChange}
                  placeholder="mm:ss or hh:mm:ss"
                  disabled={uploading}
                  className={durationDetected ? 'auto-filled' : ''}
                />

                <p className="help-text">
                  Format: mm:ss or hh:mm:ss (e.g., 5:30 or 1:23:45)
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="fileCode">Abyss File Code *</label>

                <input
                  type="text"
                  id="fileCode"
                  value={fileCode}
                  onChange={(e) => setFileCode(e.target.value)}
                  placeholder="e.g., abc123xyz"
                  disabled={uploading}
                  required
                />

                <p className="help-text">
                  Enter the file code from an existing Abyss.to video
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (optional)</label>

                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={handleDurationChange}
                  placeholder="mm:ss or hh:mm:ss"
                  disabled={uploading}
                />

                <p className="help-text">
                  Format: mm:ss or hh:mm:ss (e.g., 5:30 or 1:23:45)
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              Video uploaded successfully! Redirecting...
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cancel-button"
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  {uploadMode === 'file' ? 'Uploading...' : 'Adding...'}
                </>
              ) : (
                uploadMode === 'file' ? 'Upload Video' : 'Add Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
