import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import videoService from "../services/videoService";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginRoute = location.pathname === "/upload/admin";
  const isPanelRoute = location.pathname === "/upload/admin/panel";

  const [adminPassword, setAdminPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
  });

  const savedPassword = useMemo(() => {
    return localStorage.getItem("adminPassword") || "";
  }, []);

  // ==============================
  // ADMIN VERIFY
  // ==============================
  const handleLogin = async () => {
    try {
      setError(null);
      setVerifying(true);

      if (!adminPassword.trim()) {
        setError("Admin password is required");
        setVerifying(false);
        return;
      }

      await videoService.verifyAdmin(adminPassword.trim());

      localStorage.setItem("adminPassword", adminPassword.trim());

      setVerifying(false);
      navigate("/upload/admin/panel");
    } catch (err) {
      console.error("Admin login failed:", err);
      setError("Invalid admin password ❌");
      setVerifying(false);
      localStorage.removeItem("adminPassword");
    }
  };

  // ==============================
  // FETCH VIDEOS
  // ==============================
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await videoService.getAllVideos();
      setVideos(response.videos || []);
    } catch (err) {
      console.error("Fetch videos error:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FETCH STATS
  // ==============================
  const fetchStats = async () => {
    try {
      const response = await videoService.getAdminStats(
        localStorage.getItem("adminPassword")
      );
      setStats(response.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  // ==============================
  // DELETE VIDEO
  // ==============================
  const handleDelete = async (videoId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video?"
    );

    if (!confirmDelete) return;

    try {
      setError(null);

      await videoService.deleteVideo(
        videoId,
        localStorage.getItem("adminPassword")
      );

      await fetchVideos();
      await fetchStats();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    localStorage.removeItem("adminPassword");
    navigate("/");
  };

  // ==============================
  // FILTER VIDEOS (title + file_code)
  // ==============================
  const filteredVideos = useMemo(() => {
    if (!search.trim()) return videos;

    const q = search.toLowerCase();

    return videos.filter((v) => {
      const title = (v.title || "").toLowerCase();
      const fileCode = (v.file_code || "").toLowerCase();

      return title.includes(q) || fileCode.includes(q);
    });
  }, [videos, search]);

  // ==============================
  // AUTO REDIRECT RULES
  // ==============================
  useEffect(() => {
    if (isPanelRoute && !savedPassword) {
      navigate("/");
    }

    if (isLoginRoute && savedPassword) {
      navigate("/upload/admin/panel");
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  // ==============================
  // LOAD DASHBOARD DATA
  // ==============================
  useEffect(() => {
    if (isPanelRoute && savedPassword) {
      fetchVideos();
      fetchStats();
    }
    // eslint-disable-next-line
  }, [isPanelRoute]);

  // ==============================
  // UI: LOGIN PAGE
  // ==============================
  if (isLoginRoute) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <h2>Admin Login</h2>
          <p>Enter admin password to access hidden dashboard</p>

          {error && <div className="alert alert-error">{error}</div>}

          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />

          <button
            className="admin-btn-primary"
            onClick={handleLogin}
            disabled={verifying}
          >
            {verifying ? "Verifying..." : "Login"}
          </button>

          <button
            className="admin-btn-secondary"
            onClick={() => navigate("/")}
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // UI: ADMIN PANEL
  // ==============================
  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Admin Panel</h1>

        <div className="admin-dashboard-actions">
          <button
            className="admin-btn-primary"
            onClick={() => navigate("/upload/admin/bulk-upload")}
          >
            ➕ Bulk Upload
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
          placeholder="Search by title or file_code..."
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

      {/* VIDEO LIST */}
      {!loading && (
        <div className="admin-video-list">
          {filteredVideos.length === 0 ? (
            <p className="empty-text">No videos found.</p>
          ) : (
            filteredVideos.map((video) => (
              <div className="admin-video-row" key={video._id}>
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
                    <b>ID:</b> {video._id} | <b>Views:</b> {video.views || 0} |{" "}
                    <b>Duration:</b> {video.duration || "0:00"}
                  </p>

                  <p className="small-text">
                    <b>File Code:</b> {video.file_code}
                  </p>
                </div>

                <div className="admin-video-actions">
                  <button
                    className="admin-btn-secondary"
                    onClick={() => navigate(`/watch/${video._id}`)}
                  >
                    ▶ Watch
                  </button>

                  <button
                    className="admin-btn-danger"
                    onClick={() => handleDelete(video._id)}
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
