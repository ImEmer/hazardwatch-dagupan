import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ProtectedRoute = ({ children, roles, allowedRoles, allowedBarangay }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password') {
    return children;
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f] text-gray-300">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  const permittedRoles = allowedRoles || roles || ['superadmin', 'admin', 'staff'];

  if (!permittedRoles.includes(user?.role)) return <Navigate to="/" replace />;

  if (allowedBarangay && user?.role === 'barangay') {
    const normalizedBarangay = (user?.barangay || '').trim();
    const allowedList = Array.isArray(allowedBarangay) ? allowedBarangay : [allowedBarangay];
    const isAllowed = allowedList.some((barangay) => barangay.toLowerCase() === normalizedBarangay.toLowerCase());
    if (!isAllowed) return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
