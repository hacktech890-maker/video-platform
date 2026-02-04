import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate('/')}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 8.64L15.27 12L10 15.36V8.64M8 5V19L19 12L8 5Z"
              fill="#ff0000"
            />
          </svg>
          <h1>VideoStream</h1>
        </div>
        <nav className="nav-links">
          <button onClick={() => navigate('/')} className="nav-button">
            Home
          </button>
          <button onClick={() => navigate('/upload')} className="nav-button upload-btn">
            Upload
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
