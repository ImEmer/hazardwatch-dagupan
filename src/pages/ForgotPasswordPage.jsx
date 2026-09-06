import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess } from '../services/alerts';
import { validateEmail } from '../services/validation';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) return;
    setSubmitting(true);
    try {
      await forgotPassword(email);
      await showSuccess('If an account exists for this email, a reset link has been sent.');
      navigate('/login');
    } catch (error) {
      await showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Reset Password" description="Enter your email and we will send you a reset link.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-gray-300">Email
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className={`auth-input mt-2 ${error ? 'border-red-500' : ''}`} />
          {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
        </label>
        <button disabled={submitting} className="auth-button">{submitting ? 'Sending...' : 'Send Reset Link'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
