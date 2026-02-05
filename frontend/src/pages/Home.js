import React, { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import videoService from "../services/videoService";
import "../styles/Home.css";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin session
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchVideos();

    // Load admin session from localStorage
    const savedPassword = localStorage.getItem("adminPassword");
    if (savedPassword) {
      setAdminPassword(savedPassword);
      setIsAdmin(true);
    }

    // Load your ad script
    const script = document.createElement("script");
    script.src =
      "https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoService.getAllVideos();
      setVideos(response.videos || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos. Please try again later.");
    } finally {
      setLoading(false);
    }
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

  // Delete video
  const handleDeleteVideo = async (videoId) => {
    if (!isAdmin) {
      alert("Admin login required!");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video? This cannot be undone!"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(videoId);

      await videoService.deleteVideo(videoId, adminPassword);

      setVideos((prev) => prev.filter((v) => v.id !== videoId));

      alert("Video deleted successfully ✅");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete video ❌");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchVideos} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="home-container">
        <div className="empty-state">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 8.64L15.27 12L10 15.36V8.64M8 5V19L19 12L8 5Z"
              fill="#666"
            />
          </svg>
          <h2>No videos yet</h2>
          <p>Upload your first video to get started!</p>

          {/* ADMIN LOGIN SECTION */}
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "#fff" }}>Admin Login</h3>
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #333",
                background: "#222",
                color: "#fff",
                marginTop: "10px",
              }}
            />
            <button
              onClick={handleAdminLogin}
              style={{
                marginLeft: "10px",
                padding: "10px 16px",
                borderRadius: "6px",
                border: "none",
                background: "red",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-layout">
      {/* LEFT AD SIDEBAR */}
      <aside className="ad-sidebar ad-sidebar-left">
        <div className="ad-sticky">
          <div className="ad-container">
            <div className="ad-label">Advertisement</div>

            <div className="ad-placeholder">
              <p>300x600 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="home-content-main">
        {/* ADMIN BAR */}
        <div className="admin-bar">
          <div className="admin-left">
            <h2 className="home-title">Videos</h2>
          </div>

          <div className="admin-right">
            {isAdmin ? (
              <>
                <span className="admin-status">✅ Admin Mode</span>
                <button className="admin-btn logout" onClick={handleAdminLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="admin-password-input"
                />
                <button className="admin-btn login" onClick={handleAdminLogin}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>

        <div className="videos-grid">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isAdmin={isAdmin}
              onDelete={handleDeleteVideo}
              deleting={deletingId === video.id}
            />
          ))}
        </div>
      </main>

      {/* RIGHT AD SIDEBAR */}
      <aside className="ad-sidebar ad-sidebar-right">
        <div className="ad-sticky">
          <div className="ad-container">
            <div className="ad-label">Advertisement</div>

            <div className="ad-placeholder">
              <p>300x600 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;
