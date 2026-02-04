import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import videoService from '../services/videoService';
import '../styles/Home.css';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
    
    // Load your ad script
    const script = document.createElement('script');
    script.src = 'https://pl28635101.effectivegatecpm.com/ae/10/47/ae1047454b116c143b22ba661108cf77.js';
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
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
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
            {/* 
              PASTE YOUR AD CODE HERE 
              Examples:
              - Google AdSense
              - Affiliate banners
              - Custom ad network code
            */}
            <div className="ad-placeholder">
              {/* Replace this div with actual ad code */}
              <p>300x600 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="home-content-main">
        <div className="videos-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </main>

      {/* RIGHT AD SIDEBAR */}
      <aside className="ad-sidebar ad-sidebar-right">
        <div className="ad-sticky">
          <div className="ad-container">
            <div className="ad-label">Advertisement</div>
            {/* 
              PASTE YOUR AD CODE HERE 
              Examples:
              - Google AdSense
              - Affiliate banners
              - Custom ad network code
            */}
            <div className="ad-placeholder">
              {/* Replace this div with actual ad code */}
              <p>300x600 Ad Space</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Home;
