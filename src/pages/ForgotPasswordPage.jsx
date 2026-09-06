import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess } from '../services/alerts';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
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
        <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input" />
        <button disabled={submitting} className="auth-button">{submitting ? 'Sending...' : 'Send Reset Link'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
