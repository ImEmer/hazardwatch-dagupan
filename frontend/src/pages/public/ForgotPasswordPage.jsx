import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess } from '../../services/alerts';
import { validateEmail } from '../../services/validation';

const ForgotPasswordPage = () => {
  const { forgotPassword, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const targetEmail = (user?.email || email).trim();

  const submit = async (event) => {
    event.preventDefault();
    if (!user && !targetEmail) {
      const nextError = validateEmail('');
      setError(nextError);
      return;
    }
    if (!user) {
      const nextError = validateEmail(targetEmail);
      setError(nextError);
      if (nextError) return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(targetEmail);
      await showSuccess('We sent a 6-digit code to your verified email.');
      navigate(`/enter-reset-code?email=${encodeURIComponent(targetEmail)}`);
    } catch (error) {
      const message = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')
        ? 'Request timed out. Please try again.'
        : error.message || 'Unable to send the reset request. Please try again.';
      setError(message);
      await showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Reset Password" description={user ? 'We will send a 6-digit reset code to the email attached to your account.' : 'Enter your email and we will send you a 6-digit reset code.'}>
      <form onSubmit={submit} className="space-y-4">
        {!user && (
          <label className="block text-sm text-gray-300">Email
            <input type="email" id="email" name="email" autoComplete="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className={`auth-input mt-2 ${error ? 'border-red-500' : ''}`} />
            {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
          </label>
        )}
        {user && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">
            We will send the reset code to your verified account email.
          </div>
        )}
        <button disabled={submitting} className="auth-button">{submitting ? 'Sending...' : 'Send Reset Code'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
