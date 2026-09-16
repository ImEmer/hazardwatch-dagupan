import React from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const SessionExpiryModal = () => {
  const { pathname } = useLocation();
  const { showExpiryWarning, refreshSession, logout } = useAuth();

  if (!showExpiryWarning || AUTH_PATHS.some((path) => pathname.startsWith(path))) return null;

  const handleStayLoggedIn = async () => {
    try {
      await refreshSession();
    } catch {
      await logout();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="session-expiry-title">
      <div className="w-full max-w-md rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 text-white shadow-2xl">
        <h2 id="session-expiry-title" className="text-xl font-bold">Session expiring soon</h2>
        <p className="mt-3 text-sm text-gray-300">Your session will expire in 5 minutes. Stay logged in?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => logout()} className="rounded-lg border border-[#2e303a] px-4 py-2 text-sm text-gray-300 hover:text-white">Log Out</button>
          <button type="button" onClick={handleStayLoggedIn} className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">Stay Logged In</button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiryModal;
