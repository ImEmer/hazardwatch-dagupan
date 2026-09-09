import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess, showWarning } from '../../services/alerts';
import { validatePassword } from '../../services/validation';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      password: validatePassword(passwords.password),
      confirmPassword: !passwords.confirmPassword ? 'Please confirm your password.' : passwords.password !== passwords.confirmPassword ? 'Passwords do not match.' : '',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      await showWarning('Please fill in all required fields correctly.');
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
        <label className="block text-sm text-gray-300">New Password
          <input minLength="6" type="password" id="password" name="password" autoComplete="new-password" placeholder="New password" value={passwords.password} onChange={(event) => setPasswords({ ...passwords, password: event.target.value })} className={`auth-input mt-2 ${errors.password ? 'border-red-500' : ''}`} />
          {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password}</span>}
        </label>
        <label className="block text-sm text-gray-300">Confirm Password
          <input minLength="6" type="password" id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Confirm password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} className={`auth-input mt-2 ${errors.confirmPassword ? 'border-red-500' : ''}`} />
          {errors.confirmPassword && <span className="mt-1 block text-xs text-red-400">{errors.confirmPassword}</span>}
        </label>
        <button disabled={submitting} className="auth-button">{submitting ? 'Resetting...' : 'Reset Password'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordPage;
