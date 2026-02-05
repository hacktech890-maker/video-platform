import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VideoCard.css";

const VideoCard = ({ video, isAdmin = false, onDelete = null, deleting = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/watch/${video.id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // ❗ prevent opening video

    if (!onDelete) return;

    onDelete(video.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="video-card" onClick={handleClick}>
      <div className="video-thumbnail">
        <img
          src={video.thumbnail}
          alt={video.title}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/320x180/1a1a1a/ffffff?text=No+Thumbnail";
          }}
        />

        {video.duration && (
          <span className="video-duration">{video.duration}</span>
        )}

        {/* ✅ ADMIN DELETE BUTTON */}
        {isAdmin && (
          <button
            className="admin-delete-btn"
            onClick={handleDeleteClick}
            disabled={deleting}
            title="Delete Video"
          >
            {deleting ? "Deleting..." : "🗑 Delete"}
          </button>
        )}
      </div>

      <div className="video-info">
        <h3 className="video-title">{video.title}</h3>

        <div className="video-metadata">
          <span className="video-views">{video.views || 0} views</span>
          <span className="video-date">{formatDate(video.upload_date)}</span>
        </div>

        {/* OPTIONAL: show file_code for admin */}
        {isAdmin && video.file_code && (
          <div className="admin-filecode">
            <small>Code: {video.file_code}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
