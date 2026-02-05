import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import videoService from "../services/videoService";
import "../styles/Upload.css";

const Upload = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Upload mode
  const [uploadMode, setUploadMode] = useState("file"); // file or code

  // Admin password
  const [adminPassword, setAdminPassword] = useState("");

  // Single Code Upload state
  const [fileCode, setFileCode] = useState("");
  const [codeTitle, setCodeTitle] = useState("");

  // Bulk upload queue state
  const [queue, setQueue] = useState([]);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [processingMetadata, setProcessingMetadata] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load saved admin password
  useEffect(() => {
    const savedPassword = localStorage.getItem("adminPassword");
    if (savedPassword) {
      setAdminPassword(savedPassword);
    }
  }, []);

  // Format duration seconds -> mm:ss or hh:mm:ss
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Validate duration format
  const validateDuration = (dur) => {
    if (!dur) return true;
    const pattern = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/;
    return pattern.test(dur);
  };

  // Generate thumbnail + detect duration for a given file
  const generateMetadata = (videoFile) => {
    return new Promise((resolve) => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
          resolve({
            duration: "0:00",
            thumbnailFile: null,
            thumbnailPreview: null,
          });
          return;
        }

        const objectUrl = URL.createObjectURL(videoFile);
        video.src = objectUrl;

        video.onloadedmetadata = () => {
          const detectedDuration = formatDuration(video.duration);

          video.onloadeddata = () => {
            const seekTime = Math.min(1, video.duration * 0.1);
            video.currentTime = seekTime;
          };

          video.onseeked = () => {
            try {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const thumbnailFile = new File([blob], "thumbnail.jpg", {
                      type: "image/jpeg",
                    });

                    const previewUrl = URL.createObjectURL(blob);

                    URL.revokeObjectURL(objectUrl);

                    resolve({
                      duration: detectedDuration,
                      thumbnailFile,
                      thumbnailPreview: previewUrl,
                    });
                  } else {
                    URL.revokeObjectURL(objectUrl);
                    resolve({
                      duration: detectedDuration,
                      thumbnailFile: null,
                      thumbnailPreview: null,
                    });
                  }
                },
                "image/jpeg",
                0.9
              );
            } catch (err) {
              console.error("Thumbnail generation error:", err);
              URL.revokeObjectURL(objectUrl);
              resolve({
                duration: detectedDuration,
                thumbnailFile: null,
                thumbnailPreview: null,
              });
            }
          };
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({
            duration: "0:00",
            thumbnailFile: null,
            thumbnailPreview: null,
          });
        };
      } catch (err) {
        console.error("Metadata generation error:", err);
        resolve({
          duration: "0:00",
          thumbnailFile: null,
          thumbnailPreview: null,
        });
      }
    });
  };

  // Handle multiple file selection
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setError(null);
    setSuccess(false);
    setProcessingMetadata(true);

    const newQueueItems = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");

      const meta = await generateMetadata(file);

      newQueueItems.push({
        id: Date.now() + i,
        file,
        title: defaultTitle,
        duration: meta.duration || "0:00",
        thumbnail: meta.thumbnailFile,
        thumbnailPreview: meta.thumbnailPreview,
        thumbnailSource: meta.thumbnailFile ? "auto" : "default",
        status: "pending", // pending, uploading, done, error
        progress: 0,
        errorMessage: null,
      });
    }

    setQueue((prev) => [...prev, ...newQueueItems]);
    setProcessingMetadata(false);

    e.target.value = "";
  };

  // Update queue item
  const updateQueueItem = (id, updates) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Remove item from queue
  const removeFromQueue = (id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Manual thumbnail change per queue item
  const handleThumbnailChange = (id, e) => {
    const thumbnailFile = e.target.files[0];
    if (!thumbnailFile) return;

    if (!thumbnailFile.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setError("Thumbnail must be JPG, PNG, or WebP");
      return;
    }

    const previewUrl = URL.createObjectURL(thumbnailFile);

    updateQueueItem(id, {
      thumbnail: thumbnailFile,
      thumbnailPreview: previewUrl,
      thumbnailSource: "manual",
    });

    setError(null);
  };

  // Upload one item with REAL progress
  const uploadSingleItem = async (item) => {
    try {
      updateQueueItem(item.id, {
        status: "uploading",
        progress: 0,
        errorMessage: null,
      });

      await videoService.uploadVideo(
        item.file,
        item.title,
        item.duration || "0:00",
        item.thumbnail,
        adminPassword,
        (percent) => {
          updateQueueItem(item.id, { progress: percent });
        }
      );

      updateQueueItem(item.id, {
        status: "done",
        progress: 100,
      });
    } catch (err) {
      console.error("Upload failed:", err);

      updateQueueItem(item.id, {
        status: "error",
        progress: 0,
        errorMessage:
          err.response?.data?.message || "Upload failed. Try again.",
      });
    }
  };

  // Upload all sequentially
  const handleUploadAll = async () => {
    setError(null);
    setSuccess(false);

    if (!adminPassword.trim()) {
      setError("Admin password is required!");
      return;
    }

    // Save admin password to localStorage
    localStorage.setItem("adminPassword", adminPassword);

    if (!queue.length) {
      setError("Please select at least one video file.");
      return;
    }

    // Validate titles + duration
    for (let item of queue) {
      if (!item.title.trim()) {
        setError("Every video must have a title.");
        return;
      }

      if (item.duration && !validateDuration(item.duration)) {
        setError(
          `Invalid duration format for "${item.title}". Use mm:ss or hh:mm:ss`
        );
        return;
      }
    }

    setUploading(true);

    for (let item of queue) {
      if (item.status === "done") continue;
      await uploadSingleItem(item);
    }

    setUploading(false);
    setSuccess(true);

    setTimeout(() => {
      navigate("/");
    }, 2500);
  };

  // Add by Code upload (single)
  const handleAddByCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!adminPassword.trim()) {
      setError("Admin password is required!");
      return;
    }

    if (!fileCode.trim()) {
      setError("Please enter Abyss file code");
      return;
    }

    // Save admin password
    localStorage.setItem("adminPassword", adminPassword);

    try {
      setUploading(true);

      await videoService.addVideoByCode(
        fileCode,
        codeTitle || fileCode,
        "0:00",
        adminPassword
      );

      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Add by code error:", err);
      setError(err.response?.data?.message || "Failed to add video by code.");
    } finally {
      setUploading(false);
    }
  };

  // Cleanup thumbnails
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.thumbnailPreview) URL.revokeObjectURL(item.thumbnailPreview);
      });
    };
  }, [queue]);

  return (
    <div className="upload-container">
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="upload-card">
        <h1>Upload Video</h1>

        {/* ADMIN PASSWORD */}
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

        {/* MODE TOGGLE */}
        <div className="upload-mode-toggle">
          <button
            className={`mode-button ${uploadMode === "file" ? "active" : ""}`}
            onClick={() => setUploadMode("file")}
            disabled={uploading}
            type="button"
          >
            Bulk Upload
          </button>

          <button
            className={`mode-button ${uploadMode === "code" ? "active" : ""}`}
            onClick={() => setUploadMode("code")}
            disabled={uploading}
            type="button"
          >
            Add by Code
          </button>
        </div>

        {/* BULK UPLOAD MODE */}
        {uploadMode === "file" ? (
          <>
            <div className="form-group">
              <label>Select Video Files *</label>

              <div className="file-input-wrapper">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="video/*"
                  disabled={uploading}
                  multiple
                />
              </div>

              <p className="help-text">
                Select multiple videos. They will be added into queue.
              </p>
            </div>

            {processingMetadata && (
              <div className="metadata-processing">
                <span className="spinner-small"></span>
                <span>Detecting metadata...</span>
              </div>
            )}

            {/* QUEUE LIST */}
            {queue.length > 0 && (
              <div className="queue-container">
                <h3>Upload Queue ({queue.length})</h3>

                {queue.map((item) => (
                  <div className="queue-item" key={item.id}>
                    <div className="queue-thumbnail">
                      {item.thumbnailPreview ? (
                        <img src={item.thumbnailPreview} alt="thumbnail" />
                      ) : (
                        <div className="thumbnail-placeholder">No Thumb</div>
                      )}
                    </div>

                    <div className="queue-details">
                      <div className="queue-row">
                        <label>Title:</label>
                        <input
                          type="text"
                          value={item.title}
                          disabled={uploading || item.status === "done"}
                          onChange={(e) =>
                            updateQueueItem(item.id, { title: e.target.value })
                          }
                        />
                      </div>

                      <div className="queue-row">
                        <label>Duration:</label>
                        <input
                          type="text"
                          value={item.duration}
                          disabled={uploading || item.status === "done"}
                          onChange={(e) =>
                            updateQueueItem(item.id, {
                              duration: e.target.value,
                            })
                          }
                          placeholder="mm:ss or hh:mm:ss"
                        />
                      </div>

                      <div className="queue-row">
                        <label>Thumbnail:</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          disabled={uploading || item.status === "done"}
                          onChange={(e) => handleThumbnailChange(item.id, e)}
                        />
                      </div>

                      <div className="queue-meta">
                        <p>
                          <b>File:</b> {item.file.name}
                        </p>
                        <p>
                          <b>Size:</b>{" "}
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      {/* STATUS */}
                      <div className="queue-status">
                        {item.status === "pending" && (
                          <span className="badge pending">⏳ Pending</span>
                        )}
                        {item.status === "uploading" && (
                          <span className="badge uploading">🚀 Uploading</span>
                        )}
                        {item.status === "done" && (
                          <span className="badge done">✅ Done</span>
                        )}
                        {item.status === "error" && (
                          <span className="badge error">❌ Failed</span>
                        )}
                      </div>

                      {/* PROGRESS */}
                      {item.status === "uploading" && (
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* ERROR MESSAGE */}
                      {item.status === "error" && item.errorMessage && (
                        <div className="queue-error">{item.errorMessage}</div>
                      )}
                    </div>

                    <div className="queue-actions">
                      {item.status !== "done" && (
                        <button
                          type="button"
                          className="remove-button"
                          disabled={uploading}
                          onClick={() => removeFromQueue(item.id)}
                        >
                          ❌ Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            {success && (
              <div className="alert alert-success">
                All videos uploaded successfully! Redirecting...
              </div>
            )}

            {/* ACTIONS */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="cancel-button"
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="submit-button"
                onClick={handleUploadAll}
                disabled={uploading || queue.length === 0}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading Queue...
                  </>
                ) : (
                  "Upload All"
                )}
              </button>
            </div>
          </>
        ) : (
          // CODE MODE
          <form onSubmit={handleAddByCode} className="upload-form">
            <div className="form-group">
              <label>Abyss File Code *</label>
              <input
                type="text"
                value={fileCode}
                onChange={(e) => setFileCode(e.target.value)}
                placeholder="e.g. abc123xyz"
                disabled={uploading}
                required
              />
            </div>

            <div className="form-group">
              <label>Title (optional)</label>
              <input
                type="text"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="Enter video title"
                disabled={uploading}
              />
              <p className="help-text">
                If empty, file code will be used as title.
              </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {success && (
              <div className="alert alert-success">
                Video added successfully! Redirecting...
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/")}
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
                    Adding...
                  </>
                ) : (
                  "Add Video"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Upload;
