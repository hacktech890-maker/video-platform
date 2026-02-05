import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import videoService from "../services/videoService";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [adminPassword, setAdminPassword] = useState(
    localStorage.getItem("adminPassword") || ""
  );

  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);

  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
  });

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  // ==========================
  // VERIFY ADMIN
  // ==========================
  const verifyAdmin = async () => {
    try {
      setVerifying(true);
      setError(null);

      if (!adminPassword.trim()) {
        setVerifying(false);
        return;
      }

      await videoService.verifyAdmin(adminPassword);

      localStorage.setItem("adminPassword", adminPassword);
      setVerifying(false);
    } catch (err) {
      console.error("Admin verify failed:", err);
      setError("Invalid admin password!");
      localStorage.removeItem("adminPassword");
      setVerifying(false);
    }
  };

  // ==========================
  // FETCH VIDEOS
  // ==========================
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await videoService.getAllVideos();
      const list = response.videos || [];

      setVideos(list);
      setFilteredVideos(list);
    } catch (err) {
      console.error("Fetch videos error:", err);
      setError("Failed to load videos.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // FETCH STATS
  // ==========================
  const fetchStats = async () => {
    try {
      const response = await videoService.getAdminStats(adminPassword);
      setStats(response.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  // ==========================
  // DELETE VIDEO
  // ==========================
  const handleDelete = async (videoId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video?"
    );

    if (!confirmDelete) return;

    try {
      setError(null);

      await videoService.deleteVideo(videoId, adminPassword);

      await fetchVideos();
      await fetchStats();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Delete failed.");
    }
  };

  // ==========================
  // LOGOUT
  // ==========================
  const handleLogout = () => {
    localStorage.removeItem("adminPassword");
    setAdminPassword("");
    navigate("/");
  };

  // ==========================
  // FILTER VIDEOS
  // ==========================
  useEffect(() => {
    const filtered = videos.filter((v) =>
      v.title.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredVideos(filtered);
  }, [search, videos]);

  // ==========================
  // INIT LOAD
  // ==========================
  useEffect(() => {
    verifyAdmin();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!verifying && adminPassword.trim()) {
      fetchVideos();
      fetchStats();
    }
    // eslint-disable-next-line
  }, [verifying]);

  // ==========================
  // UI: LOGIN SCREEN
  // ==========================
  if (verifying) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h2>Admin Dashboard</h2>
          <p>Verifying admin access...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // If password not saved
  if (!adminPassword.trim()) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h2>Admin Login</h2>
          <p>Enter admin password to access dashboard</p>

          {error && <div className="alert alert-error">{error}</div>}

          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />

          <button className="admin-btn-primary" onClick={verifyAdmin}>
            Login
          </button>

          <button className="admin-btn-secondary" onClick={() => navigate("/")}>
            Back Home
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // UI: DASHBOARD
  // ==========================
  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>

        <div className="admin-dashboard-actions">
          <button
            className="admin-btn-primary"
            onClick={() => navigate("/upload")}
          >
            ➕ Upload Videos
          </button>

          <button className="admin-btn-secondary" onClick={fetchVideos}>
            🔄 Refresh
          </button>

          <button className="admin-btn-danger" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="admin-stats-grid">
        <div className="stat-box">
          <h3>Total Videos</h3>
          <p>{stats.totalVideos}</p>
        </div>

        <div className="stat-box">
          <h3>Total Views</h3>
          <p>{stats.totalViews}</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="admin-search-box">
        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ERROR */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* LOADING */}
      {loading && (
        <div className="loading-area">
          <div className="loading-spinner"></div>
          <p>Loading videos...</p>
        </div>
      )}

      {/* VIDEO TABLE */}
      {!loading && (
        <div className="admin-video-list">
          {filteredVideos.length === 0 ? (
            <p className="empty-text">No videos found.</p>
          ) : (
            filteredVideos.map((video) => (
              <div className="admin-video-row" key={video.id}>
                <div className="admin-video-thumb">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/160x90/1a1a1a/ffffff?text=No+Thumb";
                    }}
                  />
                </div>

                <div className="admin-video-info">
                  <h3>{video.title}</h3>
                  <p>
                    <b>ID:</b> {video.id} | <b>Views:</b> {video.views || 0} |{" "}
                    <b>Duration:</b> {video.duration || "0:00"}
                  </p>

                  <p className="small-text">
                    <b>File Code:</b> {video.file_code}
                  </p>
                </div>

                <div className="admin-video-actions">
                  <button
                    className="admin-btn-secondary"
                    onClick={() => navigate(`/watch/${video.id}`)}
                  >
                    ▶ Watch
                  </button>

                  <button
                    className="admin-btn-danger"
                    onClick={() => handleDelete(video.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
