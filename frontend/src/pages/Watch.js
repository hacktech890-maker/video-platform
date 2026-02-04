import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import videoService from '../services/videoService';
import '../styles/Watch.css';

const Watch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideo();
    
    // Load your ad script
    const script = document.createElement('script');
    script.src = 'https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js';
    script.async = true;
    document.body.appendChild(script);
  }, [id]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVideoById(id);
      setVideo(response.video);
      setError(null);
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Video not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <p className="error-message">{error || 'Video not found'}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = videoService.getEmbedUrlFromCode(video.file_code);

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
            <span className="stat-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                  fill="currentColor"
                />
              </svg>
              {video.views || 0} views
            </span>
            <span className="stat-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"
                  fill="currentColor"
                />
              </svg>
              {formatDate(video.upload_date)}
            </span>
          </div>

          <div className="video-description">
            <p>File ID: {video.file_code}</p>
            {video.duration && video.duration !== '0:00' && (
              <p>Duration: {video.duration}</p>
            )}
          </div>
        </div>

        <div className="back-navigation">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
        </div>
      </main>

      {/* RIGHT AD SIDEBAR */}
      <aside className="watch-ad-sidebar">
        <div className="ad-sticky">
          <div className="ad-container">
            <div className="ad-label">Advertisement</div>
            {/* 
              PASTE YOUR AD CODE HERE 
              Examples:
              - Google AdSense
              - Affiliate banners
              - Video-related ads
            */}
            <div className="ad-placeholder">
              {/* Replace this div with actual ad code */}
              <p>300x600 Ad Space</p>
            </div>
          </div>

          {/* OPTIONAL: Second ad unit */}
          <div className="ad-container" style={{ marginTop: '24px' }}>
            <div className="ad-label">Advertisement</div>
            <div className="ad-placeholder" style={{ height: '250px' }}>
              <p>300x250 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Watch;
