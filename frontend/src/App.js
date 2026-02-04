import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Upload from './pages/Upload';
import './styles/App.css';

// ✅ Protect Upload Route
const ProtectedUploadRoute = ({ children }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const key = params.get("key");

  // ✅ Your admin key stored in Netlify env variable
  const ADMIN_KEY = process.env.REACT_APP_ADMIN_KEY;

  if (!ADMIN_KEY) {
    console.error("⚠️ REACT_APP_ADMIN_KEY is missing in Netlify Environment Variables!");
    return <Navigate to="/" replace />;
  }

  // If key doesn't match, redirect to home
  if (key !== ADMIN_KEY) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:id" element={<Watch />} />

            {/* ✅ Protected Upload Page */}
            <Route
              path="/upload"
              element={
                <ProtectedUploadRoute>
                  <Upload />
                </ProtectedUploadRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
