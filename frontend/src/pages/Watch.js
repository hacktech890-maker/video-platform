import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import videoService from "../services/videoService";
import "../styles/Watch.css";

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin session
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Delete state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Load admin session from localStorage
    const savedPassword = localStorage.getItem("adminPassword");
    if (savedPassword) {
      setAdminPassword(savedPassword);
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await videoService.getVideoById(id);
        setVideo(response.video);
        setError(null);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Video not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();

    // Load ad script
    const script = document.createElement("script");
    script.src =
      "https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Admin Login
  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      alert("Enter admin password!");
      return;
    }

    try {
      await videoService.verifyAdmin(adminPassword);

      localStorage.setItem("adminPassword", adminPassword);
      setIsAdmin(true);

      alert("Admin login successful ✅");
    } catch (err) {
      console.error("Admin login failed:", err);
      alert("Wrong password ❌");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminPassword");
    setAdminPassword("");
    setIsAdmin(false);
    alert("Logged out ✅");
  };

  // Admin Delete
  const handleDeleteVideo = async () => {
    if (!isAdmin) {
      alert("Admin login required!");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video? This cannot be undone!"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      await videoService.deleteVideo(video.id, adminPassword);

      alert("Video deleted successfully ✅");
      navigate("/");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete video ❌");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="watch-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="watch-container">
        <div className="error-container">
          <p className="error-message">{error || "Video not found"}</p>
          <button onClick={() => navigate("/")} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Embed URL fallback
  const embedUrl = `https://short.icu/${video.embed_code || video.file_code}`;

  return (
    <div className="watch-page-layout">
      {/* MAIN VIDEO CONTENT */}
      <main className="watch-content-main">
        <div className="video-player-wrapper">
          <iframe
            src={embedUrl}
            className="video-player"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; encrypted-media"
            title={video.title}
          ></iframe>
        </div>

        <div className="video-details">
          <h1 className="video-title">{video.title}</h1>

          <div className="video-stats">
            <span className="stat-item">{video.views || 0} views</span>
            <span className="stat-item">{formatDate(video.upload_date)}</span>
          </div>

          <div className="video-description">
            <p>
              <b>File ID:</b> {video.file_code}
            </p>
            <p>
              <b>Duration:</b> {video.duration || "0:00"}
            </p>
          </div>

          {/* ✅ ADMIN DELETE BUTTON */}
          <div className="watch-admin-actions">
            {isAdmin ? (
              <>
                <span className="admin-status-text">✅ Admin Mode</span>
                <button
                  className="delete-video-btn"
                  onClick={handleDeleteVideo}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "🗑 Delete Video"}
                </button>

                <button
                  className="logout-video-btn"
                  onClick={handleAdminLogout}
                  disabled={deleting}
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="admin-login-box">
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button onClick={handleAdminLogin}>Login</button>
              </div>
            )}
          </div>
        </div>

        <div className="back-navigation">
          <button onClick={() => navigate("/")} className="back-button">
            ← Back to Home
          </button>
        </div>
      </main>

      {/* RIGHT AD SIDEBAR */}
      <aside className="watch-ad-sidebar">
        <div className="ad-sticky">
          <div className="ad-container">
            <div className="ad-label">Advertisement</div>
            <div className="ad-placeholder">
              <p>300x600 Ad Space</p>
            </div>
          </div>

          <div className="ad-container" style={{ marginTop: "24px" }}>
            <div className="ad-label">Advertisement</div>
            <div className="ad-placeholder" style={{ height: "250px" }}>
              <p>300x250 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Watch;
