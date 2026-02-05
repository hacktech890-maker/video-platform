import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Upload from "./pages/Upload";

// (we will create this later)
import AdminDashboard from "./pages/AdminDashboard";

import "./styles/App.css";

// ✅ Protect Admin Routes (Upload + Dashboard)
const ProtectedAdminRoute = ({ children }) => {
  const savedPassword = localStorage.getItem("adminPassword");

  if (!savedPassword) {
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

            {/* ✅ ADMIN ROUTES */}
            <Route
              path="/upload"
              element={
                <ProtectedAdminRoute>
                  <Upload />
                </ProtectedAdminRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
