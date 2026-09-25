import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { showError } from '../../services/alerts';
import { AuthCard } from './RegisterPage';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      showError('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api'}/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
          showError(data.message || 'Verification failed.');
          return;
        }

        setStatus('success');
        setMessage('Your email has been verified. You can now log in.');
      } catch (error) {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
        showError('Verification failed. Please try again.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <AuthCard title={status === 'success' ? 'Email Verified' : status === 'error' ? 'Verification Issue' : 'Verifying Email'} description="HazardWatch account confirmation">
      <div className="space-y-4 text-center">
        <p className={`rounded-lg p-3 text-sm ${status === 'success' ? 'bg-emerald-500/10 text-emerald-300' : status === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-blue-500/10 text-blue-300'}`}>
          {message}
        </p>
        <Link to="/login" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-500">
          Go to login
        </Link>
      </div>
    </AuthCard>
  );
};

export default VerifyEmailPage;
