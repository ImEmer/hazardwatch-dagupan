import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { showError } from '../../services/alerts';

const GoogleAuthSuccess = () => {
  const { loginWithToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    let cancelled = false;

    const completeLogin = async () => {
      if (!token) {
        await showError('Google sign-in could not be completed.');
        if (!cancelled) navigate('/login?error=google_failed', { replace: true });
        return;
      }

      try {
        const user = await loginWithToken(token);
        if (cancelled) return;
        const role = user?.role?.toLowerCase();
        const targetRoute = role === 'barangay'
          ? '/barangay/dashboard'
          : role === 'superadmin'
            ? '/superadmin/dashboard'
            : role === 'admin'
              ? '/admin/dashboard'
              : '/';
        navigate(targetRoute, { replace: true });
      } catch {
        if (cancelled) return;
        await showError('Google sign-in could not be completed.');
        navigate('/login?error=google_failed', { replace: true });
      }
    };

    completeLogin();
    return () => { cancelled = true; };
  }, [location.search, loginWithToken, navigate]);

  return <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 text-sm text-gray-300">Signing you in with Google...</div>;
};

export default GoogleAuthSuccess;