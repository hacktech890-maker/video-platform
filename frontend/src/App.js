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

import AdminDashboard from "./pages/AdminDashboard";

import "./styles/App.css";

// ✅ Protect Admin Routes (Admin Panel + Upload)
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

            {/* ✅ HIDDEN ADMIN ROUTES */}
            {/* Login page is NOT protected so you can login */}
            <Route path="/upload/admin" element={<AdminDashboard />} />

            {/* Admin panel is protected */}
            <Route
              path="/upload/admin/panel"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />

            {/* Bulk upload page is protected */}
            <Route
              path="/upload/admin/bulk-upload"
              element={
                <ProtectedAdminRoute>
                  <Upload />
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
