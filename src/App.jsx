import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import SubmitReport from './pages/SubmitReport';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminReportDetailPage from './pages/AdminReportDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminMapPage from './pages/AdminMapPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

const PublicPlaceholder = ({ title, description }) => (
  <div className="min-h-screen bg-[#0a0b0f] px-4 pb-10 pt-28 text-white">
    <div className="mx-auto max-w-6xl rounded-2xl border border-[#2e303a] bg-[#14151d] p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-[#60a5fa]">HazardWatch</p>
      <h1 className="mt-3 text-3xl font-bold">{title}</h1>
      <p className="mt-3 max-w-2xl text-gray-400">{description}</p>
    </div>
  </div>
);

const PublicPage = ({ children }) => <PublicLayout>{children}</PublicLayout>;

function App() {
  return (
    <AuthProvider>
      <ReportProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
            <Route path="/submit" element={<PublicPage><SubmitReport /></PublicPage>} />
            <Route path="/map" element={<PublicPage><PublicPlaceholder title="Hazard Map" description="Explore reported hazards across Dagupan City." /></PublicPage>} />
            <Route path="/track" element={<PublicPage><PublicPlaceholder title="Track a Report" description="Enter your report reference to follow its progress." /></PublicPage>} />
            <Route path="/about" element={<PublicPage><PublicPlaceholder title="About HazardWatch" description="HazardWatch connects citizens and local responders for faster hazard reporting." /></PublicPage>} />
            <Route path="/login" element={<PublicPage><LoginPage /></PublicPage>} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="reports/:id" element={<AdminReportDetailPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="users" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/logout" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ReportProvider>
    </AuthProvider>
  );
}

export default App;
