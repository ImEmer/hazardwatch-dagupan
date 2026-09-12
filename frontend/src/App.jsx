import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/public/HomePage';
import SubmitReport from './pages/public/SubmitReport';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import AboutPage from './pages/public/AboutPage';
import TrackReportPage from './pages/public/TrackReportPage';
import HazardMapPage from './pages/public/HazardMapPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import MyReportsPage from './pages/public/MyReportsPage';
import ReportDetailPage from './pages/public/ReportDetailPage';
import ProfilePage from './pages/public/ProfilePage';
import HelpPage from './pages/public/HelpPage';
import BarangayLayout from './components/layout/BarangayLayout';
import BonuanDashboard from './pages/barangay/bonuan/BonuanDashboard';
import BonuanReportsPage from './pages/barangay/bonuan/BonuanReportsPage';
import BonuanReportDetail from './pages/barangay/bonuan/BonuanReportDetail';
import LucaoDashboard from './pages/barangay/lucao/LucaoDashboard';
import LucaoReportsPage from './pages/barangay/lucao/LucaoReportsPage';
import LucaoReportDetail from './pages/barangay/lucao/LucaoReportDetail';
import TapuacDashboard from './pages/barangay/tapuac/TapuacDashboard';
import TapuacReportsPage from './pages/barangay/tapuac/TapuacReportsPage';
import TapuacReportDetail from './pages/barangay/tapuac/TapuacReportDetail';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminUsers from './pages/superadmin/SuperAdminUsers';
import SuperAdminSettings from './pages/superadmin/SuperAdminSettings';
import SuperAdminActivityPage from './pages/superadmin/SuperAdminActivityPage';
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

const pageTitles = [
  { match: (pathname) => pathname === '/', title: 'Dagupan HazardWatch - Home' },
  { match: (pathname) => pathname === '/about', title: 'About HazardWatch | Dagupan Community Safety' },
  { match: (pathname) => pathname === '/help', title: 'Help & FAQ | HazardWatch' },
  { match: (pathname) => pathname === '/my-reports', title: 'My Reports | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/reports/'), title: 'Report Detail | HazardWatch' },
  { match: (pathname) => pathname === '/profile', title: 'Profile & Settings | HazardWatch' },
  { match: (pathname) => pathname === '/submit', title: 'Submit Hazard Report | HazardWatch' },
  { match: (pathname) => pathname === '/map', title: 'Hazard Map | HazardWatch' },
  { match: (pathname) => pathname === '/track', title: 'Track Report | HazardWatch' },
  { match: (pathname) => pathname === '/login', title: 'Login | HazardWatch' },
  { match: (pathname) => pathname === '/register', title: 'Register | HazardWatch' },
  { match: (pathname) => pathname === '/forgot-password', title: 'Forgot Password | HazardWatch' },
  { match: (pathname) => pathname === '/barangay/bonuan/dashboard', title: 'Bonuan Barangay Dashboard | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/barangay/bonuan/reports/'), title: 'Bonuan Report Detail | HazardWatch' },
  { match: (pathname) => pathname === '/barangay/lucao/dashboard', title: 'Lucao Barangay Dashboard | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/barangay/lucao/reports/'), title: 'Lucao Report Detail | HazardWatch' },
  { match: (pathname) => pathname === '/barangay/tapuac/dashboard', title: 'Tapuac Barangay Dashboard | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/barangay/tapuac/reports/'), title: 'Tapuac Report Detail | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/dashboard', title: 'Super Admin Dashboard | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/users', title: 'Super Admin Users | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/settings', title: 'Super Admin Settings | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/activity', title: 'Super Admin Activity | HazardWatch' },
  { match: (pathname) => pathname === '/admin/dashboard', title: 'Admin Dashboard | HazardWatch' },
  { match: (pathname) => pathname === '/admin/reports', title: 'Reports Management | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/admin/reports/'), title: 'Report Details | HazardWatch' },
  { match: (pathname) => pathname === '/admin/users', title: 'User Management | HazardWatch' },
  { match: (pathname) => pathname === '/admin/activity', title: 'Activity | HazardWatch' },
  { match: (pathname) => pathname === '/admin/map', title: 'Hazard Map View | HazardWatch' },
  { match: (pathname) => pathname === '/admin/settings', title: 'Admin Settings | HazardWatch' },
];

const PageTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pageTitles.find(({ match }) => match(pathname));
    document.title = page?.title || 'HazardWatch';
  }, [pathname]);

  return null;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReportProvider>
          <Router>
            <PageTitle />
            <Routes>
            <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
            <Route path="/submit" element={<PublicPage><SubmitReport /></PublicPage>} />
            <Route path="/map" element={<PublicPage><HazardMapPage /></PublicPage>} />
            <Route path="/track" element={<PublicPage><TrackReportPage /></PublicPage>} />
            <Route path="/about" element={<PublicPage><AboutPage /></PublicPage>} />
            <Route path="/help" element={<PublicPage><HelpPage /></PublicPage>} />
            <Route path="/my-reports" element={<PublicPage><MyReportsPage /></PublicPage>} />
            <Route path="/reports/:id" element={<PublicPage><ReportDetailPage /></PublicPage>} />
            <Route path="/profile" element={<ProtectedRoute roles={['superadmin', 'admin', 'staff', 'barangay', 'user']}><PublicPage><ProfilePage /></PublicPage></ProtectedRoute>} />
            <Route path="/login" element={<PublicPage><LoginPage /></PublicPage>} />
            <Route path="/register" element={<PublicPage><RegisterPage /></PublicPage>} />
            <Route path="/forgot-password" element={<PublicPage><ForgotPasswordPage /></PublicPage>} />
            <Route path="/reset-password/:token" element={<PublicPage><ResetPasswordPage /></PublicPage>} />

            <Route path="/barangay/bonuan" element={<ProtectedRoute allowedRoles={['barangay']} allowedBarangay={['Bonuan']}><BarangayLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BonuanDashboard />} />
              <Route path="reports" element={<BonuanReportsPage />} />
              <Route path="reports/:id" element={<BonuanReportDetail />} />
            </Route>

            <Route path="/barangay/lucao" element={<ProtectedRoute allowedRoles={['barangay']} allowedBarangay={['Lucao']}><BarangayLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LucaoDashboard />} />
              <Route path="reports" element={<LucaoReportsPage />} />
              <Route path="reports/:id" element={<LucaoReportDetail />} />
            </Route>

            <Route path="/barangay/tapuac" element={<ProtectedRoute allowedRoles={['barangay']} allowedBarangay={['Tapuac']}><BarangayLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TapuacDashboard />} />
              <Route path="reports" element={<TapuacReportsPage />} />
              <Route path="reports/:id" element={<TapuacReportDetail />} />
            </Route>

            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="settings" element={<SuperAdminSettings />} />
              <Route path="activity" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminActivityPage /></ProtectedRoute>} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><AdminLayout /></ProtectedRoute>}> 
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="reports/:id" element={<AdminReportDetailPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="activity" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminActivityPage /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['superadmin', 'admin', 'staff']}><AdminSettingsPage /></ProtectedRoute>} />
            </Route>

            <Route path="/logout" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ReportProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
