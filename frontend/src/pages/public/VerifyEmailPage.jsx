import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthCard } from './RegisterPage';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api';
    window.location.replace(token
      ? `${apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`
      : `${window.location.origin}/login?verified=false&error=missing_token`);
  }, [searchParams]);

  return (
    <AuthCard title="Verifying Email" description="HazardWatch account confirmation">
      <p className="rounded-lg bg-blue-500/10 p-3 text-center text-sm text-blue-300">Redirecting to secure verification...</p>
    </AuthCard>
  );
};

export default VerifyEmailPage;
