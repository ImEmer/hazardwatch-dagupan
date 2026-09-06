import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess, showWarning } from '../services/alerts';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (passwords.password.length < 6) {
      await showWarning('Password must be at least 6 characters.');
      return;
    }
    if (passwords.password !== passwords.confirmPassword) {
      await showWarning('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, passwords.password);
      await showSuccess('Your password has been reset. You can now log in.');
      navigate('/login');
    } catch (error) {
      await showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create New Password" description="Choose a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <input required minLength="6" type="password" placeholder="New password" value={passwords.password} onChange={(event) => setPasswords({ ...passwords, password: event.target.value })} className="auth-input" />
        <input required minLength="6" type="password" placeholder="Confirm password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} className="auth-input" />
        <button disabled={submitting} className="auth-button">{submitting ? 'Resetting...' : 'Reset Password'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
