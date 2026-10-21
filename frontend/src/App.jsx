import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ReportProvider } from './context/ReportContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Toaster } from 'sonner';
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import HomePage from './pages/public/HomePage';
import SubmitReport from './pages/public/SubmitReport';
import LoginPage from './pages/public/LoginPage';
import TwoFactorPage from './pages/public/TwoFactorPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import EnterResetCodePage from './pages/public/EnterResetCodePage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import VerifyEmailPage from './pages/public/VerifyEmailPage';
import AboutPage from './pages/public/AboutPage';
import TrackReportPage from './pages/public/TrackReportPage';
import HazardMapPage from './pages/public/HazardMapPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsOfServicePage from './pages/public/TermsOfServicePage';
import ContactPage from './pages/public/ContactPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminResolvedReportsPage from './pages/admin/AdminResolvedReportsPage';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';
import AdminArchivedPage from './pages/admin/AdminArchivedPage';
import MyReportsPage from './pages/public/MyReportsPage';
import ReportDetailPage from './pages/public/ReportDetailPage';
import ProfilePage from './pages/public/ProfilePage';
import BarangayLayout from './components/layout/BarangayLayout';
import BarangayDashboard from './pages/barangay/BarangayDashboard';
import BarangayReportsPage from './pages/barangay/BarangayReportsPage';
import BarangayActivityPage from './pages/barangay/BarangayActivityPage';
import BarangayReportDetail from './pages/barangay/BarangayReportDetail';
import BarangayMapPage from './pages/barangay/BarangayMapPage';
import BarangayArchivedPage from './pages/barangay/BarangayArchivedPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SuperAdminUsers from './pages/superadmin/SuperAdminUsers';
import SettingsDashboard from './components/settings/SettingsDashboard';
import SuperAdminActivityPage from './pages/superadmin/SuperAdminActivityPage';
import SuperAdminReportsPage from './pages/superadmin/SuperAdminReportsPage';
import SuperAdminReportDetailPage from './pages/superadmin/SuperAdminReportDetailPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminInboxPage from './pages/admin/AdminInboxPage';
import BarangayNotificationsPage from './pages/barangay/BarangayNotificationsPage';
import SuperAdminNotificationsPage from './pages/superadmin/SuperAdminNotificationsPage';
import SuperAdminSystemGovernance from './pages/superadmin/SuperAdminSystemGovernance';
import ScrollToTop from './components/common/ScrollToTop';
import SessionExpiryModal from './components/SessionExpiryModal';
import { AlertTriangle } from 'lucide-react';
import useAuth from './hooks/useAuth';
import { useSocket } from './context/SocketContext';
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

const MaintenanceModeGuard = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { maintenanceMode } = useSocket();

  if (!maintenanceMode) return children;

  if (user?.role === 'superadmin') {
    return (
      <>
        <div role="status" className="fixed inset-x-0 top-0 z-[100] flex h-10 items-center justify-center bg-red-700 px-4 text-center text-sm font-semibold text-white">
          Maintenance Mode is Active
        </div>
        <div className="pt-10">{children}</div>
      </>
    );
  }

  return (
    <main className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-slate-900 p-8 text-center shadow-2xl sm:p-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-400" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-bold">Under Maintenance</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          HazardWatch is currently being updated. Please check back later.
        </p>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => logout().catch((error) => console.error('Unable to log out during maintenance.', error))}
            className="mt-8 rounded-lg border border-slate-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Logout
          </button>
        )}
      </section>
    </main>
  );
};

const pageTitles = [
  { match: (pathname) => pathname === '/', title: 'Dagupan HazardWatch - Home' },
  { match: (pathname) => pathname === '/about', title: 'About HazardWatch | Dagupan Community Safety' },
  { match: (pathname) => pathname === '/privacy', title: 'Privacy Policy | HazardWatch' },
  { match: (pathname) => pathname === '/terms', title: 'Terms of Service | HazardWatch' },
  { match: (pathname) => pathname === '/contact', title: 'Contact | HazardWatch' },
  { match: (pathname) => pathname === '/my-reports', title: 'My Reports | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/reports/'), title: 'Report Detail | HazardWatch' },
  { match: (pathname) => pathname === '/profile', title: 'Profile & Settings | HazardWatch' },
  { match: (pathname) => pathname === '/submit', title: 'Submit Hazard Report | HazardWatch' },
  { match: (pathname) => pathname === '/map' || pathname === '/hazard-map', title: 'Hazard Map | HazardWatch' },
  { match: (pathname) => pathname === '/track', title: 'Track Report | HazardWatch' },
  { match: (pathname) => pathname === '/login', title: 'Login | HazardWatch' },
  { match: (pathname) => pathname === '/register', title: 'Register | HazardWatch' },
  { match: (pathname) => pathname === '/forgot-password', title: 'Forgot Password | HazardWatch' },
  { match: (pathname) => pathname === '/enter-reset-code', title: 'Enter Reset Code | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/barangay/'), title: 'Barangay Operations | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/dashboard', title: 'Super Admin Dashboard | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/users', title: 'Super Admin Users | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/settings', title: 'Super Admin Settings | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/system-governance', title: 'System Governance | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/activity', title: 'Super Admin Activity | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/notifications', title: 'Notifications | HazardWatch' },
  { match: (pathname) => pathname === '/superadmin/inbox', title: 'Contact Inbox | HazardWatch' },
  { match: (pathname) => pathname === '/admin/dashboard', title: 'Admin Dashboard | HazardWatch' },
  { match: (pathname) => pathname === '/admin/reports', title: 'Reports Management | HazardWatch' },
  { match: (pathname) => pathname.startsWith('/admin/reports/'), title: 'Report Details | HazardWatch' },
  { match: (pathname) => pathname === '/admin/users', title: 'User Management | HazardWatch' },
  { match: (pathname) => pathname === '/admin/activity', title: 'Activity | HazardWatch' },
  { match: (pathname) => pathname === '/admin/notifications', title: 'Notifications | HazardWatch' },
  { match: (pathname) => pathname === '/admin/inbox', title: 'Contact Inbox | HazardWatch' },
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
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <ConfirmProvider>
            <Toaster position="top-right" richColors closeButton duration={4000} theme="system" />
            <ReportProvider>
              <Router>
            <MaintenanceModeGuard>
            <SessionExpiryModal />
            <ScrollToTop />
            <PageTitle />
            <Routes>
            <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
            <Route path="/submit" element={<PublicPage><SubmitReport /></PublicPage>} />
            <Route path="/map" element={<PublicPage><HazardMapPage /></PublicPage>} />
            <Route path="/hazard-map" element={<PublicPage><HazardMapPage /></PublicPage>} />
            <Route path="/track" element={<PublicPage><TrackReportPage /></PublicPage>} />
            <Route path="/about" element={<PublicPage><AboutPage /></PublicPage>} />
            <Route path="/privacy" element={<PublicPage><PrivacyPolicyPage /></PublicPage>} />
            <Route path="/terms" element={<PublicPage><TermsOfServicePage /></PublicPage>} />
            <Route path="/contact" element={<PublicPage><ContactPage /></PublicPage>} />
            <Route path="/my-reports" element={<PublicPage><MyReportsPage /></PublicPage>} />
            <Route path="/reports/:id" element={<PublicPage><ReportDetailPage /></PublicPage>} />
            <Route path="/profile" element={<ProtectedRoute roles={['superadmin', 'admin', 'barangay', 'user']}><PublicPage><ProfilePage /></PublicPage></ProtectedRoute>} />
            <Route path="/login" element={<PublicPage><LoginPage /></PublicPage>} />
            <Route path="/verify-2fa" element={<PublicPage><TwoFactorPage /></PublicPage>} />
            <Route path="/register" element={<PublicPage><RegisterPage /></PublicPage>} />
            <Route path="/forgot-password" element={<PublicPage><ForgotPasswordPage /></PublicPage>} />
            <Route path="/enter-reset-code" element={<PublicPage><EnterResetCodePage /></PublicPage>} />
            <Route path="/verify-email" element={<PublicPage><VerifyEmailPage /></PublicPage>} />
            <Route path="/reset-password/:token" element={<PublicPage><ResetPasswordPage /></PublicPage>} />

            <Route path="/barangay" element={<ProtectedRoute allowedRoles={['barangay']}><BarangayLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BarangayDashboard />} />
              <Route path="reports" element={<BarangayReportsPage />} />
              <Route path="activity" element={<ProtectedRoute allowedRoles={['barangay']}><BarangayActivityPage /></ProtectedRoute>} />
              <Route path="archived" element={<BarangayArchivedPage />} />
              <Route path="reports/resolved" element={<BarangayReportsPage resolvedOnly />} />
              <Route path="reports/:id" element={<BarangayReportDetail />} />
              <Route path="map" element={<BarangayMapPage />} />
              <Route path="settings" element={<SettingsDashboard />} />
              <Route path="notifications" element={<BarangayNotificationsPage />} />
            </Route>

            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="reports" element={<SuperAdminReportsPage />} />
              <Route path="reports/:id" element={<SuperAdminReportDetailPage />} />
              <Route path="archived" element={<AdminArchivedPage basePath="/superadmin" />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="reports/resolved" element={<AdminResolvedReportsPage basePath="/superadmin" />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="inbox" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminInboxPage /></ProtectedRoute>} />
              <Route path="settings" element={<SettingsDashboard />} />
              <Route path="system-governance" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminSystemGovernance /></ProtectedRoute>} />
              <Route path="activity" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminActivityPage /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminNotificationsPage /></ProtectedRoute>} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><AdminLayout /></ProtectedRoute>}> 
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="archived" element={<AdminArchivedPage />} />
              <Route path="reports/resolved" element={<AdminResolvedReportsPage />} />
              <Route path="reports/:id" element={<AdminReportDetailPage />} />
              <Route path="map" element={<AdminMapPage />} />
              <Route path="activity" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminActivityPage /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminNotificationsPage /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminUsersPage /></ProtectedRoute>} />
              <Route path="inbox" element={<ProtectedRoute roles={['superadmin', 'admin']}><AdminInboxPage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['superadmin', 'admin']}><SettingsDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="/logout" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </MaintenanceModeGuard>
              </Router>
            </ReportProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
